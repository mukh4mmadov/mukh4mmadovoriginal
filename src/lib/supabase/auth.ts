import { supabase } from './client';

export type AuthProvider = 'google' | 'email' | 'guest';

export interface AuthUser {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_guest: boolean;
  username: string | null;
  date_of_birth: string | null;
  country: string | null;
  bio: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpData) {
    console.log('[SIGNUP] Attempting signup with email:', data.email);
    
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    console.log("[SIGNUP] error:", error);
    console.log("[SIGNUP] user:", authData.user);
    console.log("[SIGNUP] session:", authData.session);
    console.log("[SIGNUP] identities:", authData.user?.identities);
    console.log("[SIGNUP] email_confirmed_at:", authData.user?.email_confirmed_at);

    if (error) throw error;
    return authData;
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData) {
    console.log('[SIGNIN] Attempting signin with email:', data.email);
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    console.log("[SIGNIN] error:", error);
    console.log("[SIGNIN] error.message:", error?.message);
    console.log("[SIGNIN] error.status:", error?.status);
    console.log("[SIGNIN] error.code:", error?.code);
    console.log("[SIGNIN] user:", authData.user);
    console.log("[SIGNIN] session:", authData.session);

    if (error) throw error;
    return authData;
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback',
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Create guest account (anonymous user)
   */
  async createGuestAccount() {
    const { data: authData, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          is_guest: true,
        },
      },
    });

    if (error) throw error;
    return authData;
  }

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // AuthSessionMissingError is expected when no user is logged in
      if (error.name === 'AuthSessionMissingError') {
        return null;
      }
      throw error;
    }
    return user;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<AuthUser | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return data as AuthUser;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<AuthUser>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as AuthUser;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
