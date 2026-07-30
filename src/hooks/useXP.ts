import { xpRepository } from '@/lib/supabase/repositories';
import { XP } from '@/lib/supabase/models';
import { useUserResource, withErrorLog } from './useUserResource';

interface LevelProgress {
  current: number;
  needed: number;
  percentage: number;
}

interface XPState {
  xp: XP | null;
  levelProgress: LevelProgress | null;
}

export function useXP() {
  const { user, data, setData, isLoading } = useUserResource<XPState>(
    { xp: null, levelProgress: null },
    async (currentUser) => {
      const xp = await xpRepository.getXP(currentUser.id);
      return {
        xp,
        levelProgress: xp ? await xpRepository.getLevelProgress(currentUser.id) : null,
      };
    },
    { label: 'XP' }
  );

  const addXP = async (amount: number) => {
    if (!user) return;

    const updated = await withErrorLog('adding XP', () => xpRepository.addXP(user.id, amount));
    const levelProgress = await xpRepository.getLevelProgress(user.id);
    setData({ xp: updated, levelProgress });
    return updated;
  };

  return {
    xp: data.xp,
    levelProgress: data.levelProgress,
    isLoading,
    addXP,
  };
}
