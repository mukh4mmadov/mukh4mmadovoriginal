import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { streaksRepository } from '@/lib/supabase/repositories';
import { Streak } from '@/lib/supabase/models';

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStreak(null);
      setIsLoading(false);
      return;
    }

    const loadStreak = async () => {
      setIsLoading(true);
      try {
        const data = await streaksRepository.getStreak(user.id);
        setStreak(data);
      } catch (error) {
        console.error('Error loading streak:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [user]);

  const incrementStreak = async () => {
    if (!user) return;

    try {
      const updated = await streaksRepository.incrementStreak(user.id);
      setStreak(updated);
      return updated;
    } catch (error) {
      console.error('Error incrementing streak:', error);
      throw error;
    }
  };

  const resetStreak = async () => {
    if (!user) return;

    try {
      const updated = await streaksRepository.resetStreak(user.id);
      setStreak(updated);
      return updated;
    } catch (error) {
      console.error('Error resetting streak:', error);
      throw error;
    }
  };

  return {
    streak,
    isLoading,
    incrementStreak,
    resetStreak,
  };
}
