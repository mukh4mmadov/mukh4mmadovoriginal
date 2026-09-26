"use client";

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PushActivityTracker() {
  const { user } = useAuth();
  const pathname = usePathname();
  const userId = user?.id;

  const updateActivity = useCallback(async () => {
    if (!userId || !navigator.onLine) return;

    const key = `push-reminder-last-activity-${userId}`;
    const previous = Number(window.localStorage.getItem(key)) || 0;
    if (Date.now() - previous < 15 * 60 * 1000) return;

    window.localStorage.setItem(key, String(Date.now()));
    try {
      const response = await fetch('/api/push/activity', { method: 'POST' });
      if (!response.ok) window.localStorage.removeItem(key);
    } catch {
      window.localStorage.removeItem(key);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    updateActivity();
    const intervalId = window.setInterval(updateActivity, 15 * 60 * 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updateActivity();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pathname, updateActivity, userId]);

  return null;
}
