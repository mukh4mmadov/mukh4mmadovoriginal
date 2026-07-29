import { supabase } from './client';

export type AuthProvider = 'google' | 'email' | 'guest';

export interface AuthUser {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_guest: boolean;
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
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (error) throw error;
    return authData;
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

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
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Create guest account (anonymous user)
   */
  async createGuestAccount() {
    const { data: authData, error } = await supabase.auth.signUp({
      email: `guest_${Date.now()}@temp.local`,
      password: Math.random().toString(36).substring(2),
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
    if (error) throw error;
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
