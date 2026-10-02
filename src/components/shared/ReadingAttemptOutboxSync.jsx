'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { flushReadingAttemptOutbox } from '@/lib/reading/reading-attempt-outbox.mjs';

export default function ReadingAttemptOutboxSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !supabase) return undefined;
    const flush = () => { void flushReadingAttemptOutbox(window.localStorage, user.id, supabase); };
    flush();
    window.addEventListener('online', flush);
    const interval = window.setInterval(flush, 3 * 60 * 1000);
    return () => {
      window.removeEventListener('online', flush);
      window.clearInterval(interval);
    };
  }, [user?.id]);

  return null;
}
