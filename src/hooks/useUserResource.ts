import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Load a Supabase-backed resource for the signed-in user.
 *
 * Resets to `emptyValue` when there is no user, tracks a loading flag and logs
 * (rather than throws) loading failures, which is the behaviour every
 * user-scoped hook in the app needs.
 */
export function useUserResource<T>(
  emptyValue: T,
  load: (user: User) => Promise<T>,
  { label, deps = [] as unknown[] }: { label: string; deps?: unknown[] }
) {
  const { user } = useAuth();
  const [data, setData] = useState<T>(emptyValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData(emptyValue);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    load(user)
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch((error) => {
        console.error(`Error loading ${label}:`, error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ...deps]);

  return { user, data, setData, isLoading };
}

/**
 * Run a mutation, logging failures with a consistent message before
 * re-throwing them to the caller.
 */
export async function withErrorLog<T>(label: string, mutate: () => Promise<T>): Promise<T> {
  try {
    return await mutate();
  } catch (error) {
    console.error(`Error ${label}:`, error);
    throw error;
  }
}
