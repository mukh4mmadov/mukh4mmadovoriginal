"use client";

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { authService, AuthUser } from '@/lib/supabase/auth';
import { migrationService } from '@/lib/supabase/services/migration.service';
import { analyticsService } from '@/lib/analytics/analytics.service';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocalStorageData, setHasLocalStorageData] = useState(false);
  const profileLoadSequence = useRef(0);

  useEffect(() => {
    let active = true;
    setHasLocalStorageData(migrationService.hasLocalStorageData());

    const loadProfile = async (userId, sequence) => {
      try {
        const userProfile = await authService.getUserProfile(userId);
        if (active && profileLoadSequence.current === sequence) {
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (active && profileLoadSequence.current === sequence) {
          setProfile(null);
          if (error.code === 'SESSION_EXPIRED') setUser(null);
        }
      }
    };

    const initAuth = async () => {
      const initialSequence = profileLoadSequence.current;
      try {
        const currentUser = await authService.getCurrentUser();
        if (!active || profileLoadSequence.current !== initialSequence) return;
        setUser(currentUser);

        if (currentUser) {
          setProfile(null);
          const sequence = ++profileLoadSequence.current;
          await loadProfile(currentUser.id, sequence);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (active) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      const nextUser = session?.user || null;

      if (event === 'INITIAL_SESSION') {
        setUser(nextUser);
        if (!nextUser) setProfile(null);
        setIsLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        setUser(nextUser);
        if (!nextUser) {
          profileLoadSequence.current += 1;
          setProfile(null);
        }
        setIsLoading(false);
        return;
      }

      const sequence = ++profileLoadSequence.current;
      setUser(nextUser);
      setProfile(null);
      setIsLoading(false);

      if (nextUser) {
        window.setTimeout(() => loadProfile(nextUser.id, sequence), 0);
      }
    });

    return () => {
      active = false;
      profileLoadSequence.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const authData = await authService.signIn({ email, password });
    setUser(authData.user);
    
    if (authData.user) {
      try {
        const userProfile = await authService.getUserProfile(authData.user.id);
        setProfile(userProfile);
        await analyticsService.trackUserLogin(authData.user.id);
      } catch (error) {
        console.error('Error fetching user profile after sign in:', error);
      }
    }
  };

  const signUp = async (email, password, fullName) => {
    const authData = await authService.signUp({ email, password, fullName });
    setUser(authData.user);
    
    if (authData.user) {
      try {
        const userProfile = await authService.getUserProfile(authData.user.id);
        setProfile(userProfile);
        await analyticsService.trackUserRegistration(authData.user.id, { fullName });
      } catch (error) {
        console.error('Error fetching user profile after sign up:', error);
      }
    }
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signOut = async () => {
    const userId = user?.id;
    await authService.signOut();
    setUser(null);
    setProfile(null);
    if (userId) {
      await analyticsService.trackUserLogout(userId);
    }
  };

  const createGuestAccount = async () => {
    const authData = await authService.createGuestAccount();
    setUser(authData.user);
    
    if (authData.user) {
      try {
        const userProfile = await authService.getUserProfile(authData.user.id);
        setProfile(userProfile);
        await analyticsService.trackUserRegistration(authData.user.id, { isGuest: true });
      } catch (error) {
        console.error('Error fetching user profile after guest creation:', error);
      }
    }
  };

  const migrateLocalStorage = async () => {
    if (!user) return;

    const data = migrationService.extractLocalStorageData();
    const result = await migrationService.migrateToSupabase(user.id, data);

    if (result.success) {
      migrationService.clearLocalStorage(result.failedDatasets);
      setHasLocalStorageData(false);
    } else {
      migrationService.clearLocalStorage(result.failedDatasets);
      setHasLocalStorageData(migrationService.hasLocalStorageData());
      console.error('Migration completed with failures. Local data retained:',
        result.failedDatasets.join(', '), result.errors);
    }
    return result;
  };

  const value = {
    user,
    profile,
    isLoading,
    isGuest: profile?.is_guest || false,
    signInWithGoogle,
    signOut,
    migrateLocalStorage,
    hasLocalStorageData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
