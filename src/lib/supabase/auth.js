import { supabase } from './client';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

export class AuthService {
  async signUp(data) {
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

  async signIn(data) {
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

  async signInWithGoogle() {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : null;
    const redirect = currentOrigin
      ? getSafeRedirectPath(new URLSearchParams(window.location.search).get('redirect'))
      : null;

    if (currentOrigin) {
      const redirectResponse = await fetch('/api/auth/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect }),
      });
      if (!redirectResponse.ok) {
        throw new Error('Unable to preserve the sign-in destination. Please try again.');
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: currentOrigin ? `${currentOrigin}/auth/callback` : '/auth/callback',
      },
    });

    if (error) throw error;
    return data;
  }

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

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      if (error.name === 'AuthSessionMissingError') {
        return null;
      }
      throw error;
    }
    return user;
  }

  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return data;
  }

  async updateProfile(userId, updates) {
    const profileUpdates = { ...updates };
    if (
      typeof profileUpdates.date_of_birth === 'string' &&
      profileUpdates.date_of_birth.trim() === ''
    ) {
      profileUpdates.date_of_birth = null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
