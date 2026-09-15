"use client";

import { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    // Check for localStorage data
    setHasLocalStorageData(migrationService.hasLocalStorageData());

    // Get initial session
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await authService.getUserProfile(currentUser.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);

        if (session?.user) {
          try {
            const userProfile = await authService.getUserProfile(session.user.id);
            setProfile(userProfile);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
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
      migrationService.clearLocalStorage();
      setHasLocalStorageData(false);
    } else {
      console.error('Migration completed with failures. Local data retained:',
        result.failedDatasets.join(', '), result.errors);
    }
  };

  const value = {
    user,
    profile,
    isLoading,
    isGuest: profile?.is_guest || false,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    createGuestAccount,
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
