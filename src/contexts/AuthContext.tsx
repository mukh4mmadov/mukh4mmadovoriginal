"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { authService, AuthUser } from '@/lib/supabase/auth';
import { migrationService } from '@/lib/supabase/services/migration.service';
import { analyticsService } from '@/lib/analytics/analytics.service';

interface AuthContextType {
  user: User | null;
  profile: AuthUser | null;
  isLoading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createGuestAccount: () => Promise<void>;
  migrateLocalStorage: () => Promise<void>;
  hasLocalStorageData: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
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
          const userProfile = await authService.getUserProfile(session.user.id);
          setProfile(userProfile);
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

  const signIn = async (email: string, password: string) => {
    const authData = await authService.signIn({ email, password });
    setUser(authData.user);
    
    if (authData.user) {
      const userProfile = await authService.getUserProfile(authData.user.id);
      setProfile(userProfile);
      await analyticsService.trackUserLogin(authData.user.id);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const authData = await authService.signUp({ email, password, fullName });
    setUser(authData.user);
    
    if (authData.user) {
      const userProfile = await authService.getUserProfile(authData.user.id);
      setProfile(userProfile);
      await analyticsService.trackUserRegistration(authData.user.id, { fullName });
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
      const userProfile = await authService.getUserProfile(authData.user.id);
      setProfile(userProfile);
      await analyticsService.trackUserRegistration(authData.user.id, { isGuest: true });
    }
  };

  const migrateLocalStorage = async () => {
    if (!user) return;

    const data = migrationService.extractLocalStorageData();
    await migrationService.migrateToSupabase(user.id, data);
    migrationService.clearLocalStorage();
    setHasLocalStorageData(false);
  };

  const value: AuthContextType = {
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
