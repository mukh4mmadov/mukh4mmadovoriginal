import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dailyMissionsRepository } from '@/lib/supabase/repositories';
import { DailyMission } from '@/lib/supabase/models';

export function useDailyMissions(date?: string) {
  const { user } = useAuth();
  const [missions, setMissions] = useState<DailyMission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = date || new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) {
      setMissions(null);
      setIsLoading(false);
      return;
    }

    const loadMissions = async () => {
      setIsLoading(true);
      try {
        const data = await dailyMissionsRepository.getDailyMissions(user.id, today);
        setMissions(data);
      } catch (error) {
        console.error('Error loading daily missions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMissions();
  }, [user, today]);

  const toggleMission = async (missionId: string) => {
    if (!user) return;

    try {
      const updated = await dailyMissionsRepository.toggleMission(user.id, today, missionId);
      setMissions(updated);
      return updated;
    } catch (error) {
      console.error('Error toggling mission:', error);
      throw error;
    }
  };

  const updateCompletedMissions = async (completedMissions: string[]) => {
    if (!user) return;

    try {
      const updated = await dailyMissionsRepository.updateCompletedMissions(user.id, today, completedMissions);
      setMissions(updated);
      return updated;
    } catch (error) {
      console.error('Error updating completed missions:', error);
      throw error;
    }
  };

  return {
    missions,
    isLoading,
    toggleMission,
    updateCompletedMissions,
  };
}
