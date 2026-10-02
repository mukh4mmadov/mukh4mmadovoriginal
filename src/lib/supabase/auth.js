import { supabase } from './client';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

export class AuthService {
  profileRequests = new Map();

  async signInWithGoogle() {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : null;
    const redirect = currentOrigin
      ? (() => {
          const params = new URLSearchParams(window.location.search);
          return getSafeRedirectPath(params.get('redirect') || params.get('next'));
        })()
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

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      if (error.name === 'AuthSessionMissingError') {
        return null;
      }
      throw error;
    }
    return session?.user || null;
  }

  async getUserProfile(userId) {
    const existingRequest = this.profileRequests.get(userId);
    if (existingRequest) return existingRequest;

    const request = this.#fetchUserProfile(userId);
    this.profileRequests.set(userId, request);
    try {
      return await request;
    } finally {
      if (this.profileRequests.get(userId) === request) {
        this.profileRequests.delete(userId);
      }
    }
  }

  async #fetchUserProfile(userId) {
    const fetchProfile = () =>
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    let { data, error } = await fetchProfile();

    if (error?.status === 401) {
      let refreshedSession = null;
      let refreshFailed = false;
      try {
        const { data: refreshed, error: refreshError } =
          await supabase.auth.refreshSession();
        refreshedSession = refreshed?.session || null;
        refreshFailed = Boolean(refreshError);
      } catch {
        refreshFailed = true;
      }

      if (!refreshFailed && refreshedSession?.user?.id === userId) {
        ({ data, error } = await fetchProfile());
      }

      if (refreshFailed || refreshedSession?.user?.id !== userId || error?.status === 401) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        const sessionError = new Error('Your session expired. Please sign in again.');
        sessionError.code = 'SESSION_EXPIRED';
        throw sessionError;
      }
    }

    if (error) {
      if (error.code === 'PGRST116') return null;
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
