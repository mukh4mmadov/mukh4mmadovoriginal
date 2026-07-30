import { dailyMissionsRepository } from '@/lib/supabase/repositories';
import { DailyMission } from '@/lib/supabase/models';
import { todayISODate } from '@/lib/date';
import { useUserResource, withErrorLog } from './useUserResource';

export function useDailyMissions(date?: string) {
  const today = date || todayISODate();

  const { user, data: missions, setData: setMissions, isLoading } = useUserResource<DailyMission | null>(
    null,
    (currentUser) => dailyMissionsRepository.getDailyMissions(currentUser.id, today),
    { label: 'daily missions', deps: [today] }
  );

  const toggleMission = async (missionId: string) => {
    if (!user) return;

    const updated = await withErrorLog('toggling mission', () =>
      dailyMissionsRepository.toggleMission(user.id, today, missionId)
    );
    setMissions(updated);
    return updated;
  };

  const updateCompletedMissions = async (completedMissions: string[]) => {
    if (!user) return;

    const updated = await withErrorLog('updating completed missions', () =>
      dailyMissionsRepository.updateCompletedMissions(user.id, today, completedMissions)
    );
    setMissions(updated);
    return updated;
  };

  return {
    missions,
    isLoading,
    toggleMission,
    updateCompletedMissions,
  };
}
