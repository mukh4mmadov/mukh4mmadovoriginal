import { streaksRepository } from '@/lib/supabase/repositories';
import { Streak } from '@/lib/supabase/models';
import { useUserResource, withErrorLog } from './useUserResource';

export function useStreak() {
  const { user, data: streak, setData: setStreak, isLoading } = useUserResource<Streak | null>(
    null,
    (currentUser) => streaksRepository.getStreak(currentUser.id),
    { label: 'streak' }
  );

  const incrementStreak = async () => {
    if (!user) return;

    const updated = await withErrorLog('incrementing streak', () =>
      streaksRepository.incrementStreak(user.id)
    );
    setStreak(updated);
    return updated;
  };

  const resetStreak = async () => {
    if (!user) return;

    const updated = await withErrorLog('resetting streak', () =>
      streaksRepository.resetStreak(user.id)
    );
    setStreak(updated);
    return updated;
  };

  return {
    streak,
    isLoading,
    incrementStreak,
    resetStreak,
  };
}
