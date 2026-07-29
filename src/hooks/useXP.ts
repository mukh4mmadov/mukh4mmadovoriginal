import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { xpRepository } from '@/lib/supabase/repositories';
import { XP } from '@/lib/supabase/models';

export function useXP() {
  const { user } = useAuth();
  const [xp, setXP] = useState<XP | null>(null);
  const [levelProgress, setLevelProgress] = useState<{ current: number; needed: number; percentage: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setXP(null);
      setLevelProgress(null);
      setIsLoading(false);
      return;
    }

    const loadXP = async () => {
      setIsLoading(true);
      try {
        const data = await xpRepository.getXP(user.id);
        setXP(data);
        
        if (data) {
          const progress = await xpRepository.getLevelProgress(user.id);
          setLevelProgress(progress);
        }
      } catch (error) {
        console.error('Error loading XP:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadXP();
  }, [user]);

  const addXP = async (amount: number) => {
    if (!user) return;

    try {
      const updated = await xpRepository.addXP(user.id, amount);
      setXP(updated);
      
      const progress = await xpRepository.getLevelProgress(user.id);
      setLevelProgress(progress);
      
      return updated;
    } catch (error) {
      console.error('Error adding XP:', error);
      throw error;
    }
  };

  return {
    xp,
    levelProgress,
    isLoading,
    addXP,
  };
}
