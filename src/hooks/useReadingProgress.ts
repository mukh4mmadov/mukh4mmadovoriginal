import { readingProgressRepository } from '@/lib/supabase/repositories';
import { ReadingProgress, ReadingProgressInsert } from '@/lib/supabase/models';
import { useUserResource, withErrorLog } from './useUserResource';

interface ProgressState {
  progress: ReadingProgress | null;
  allProgress: ReadingProgress[];
}

export function useReadingProgress(passageId?: string) {
  const { user, data, setData, isLoading } = useUserResource<ProgressState>(
    { progress: null, allProgress: [] },
    async (currentUser) =>
      passageId
        ? {
            progress: await readingProgressRepository.getProgress(currentUser.id, passageId),
            allProgress: [],
          }
        : {
            progress: null,
            allProgress: await readingProgressRepository.getAllProgress(currentUser.id),
          },
    { label: 'reading progress', deps: [passageId] }
  );

  const setProgress = (progress: ReadingProgress | null) =>
    setData((prev) => ({ ...prev, progress }));

  const upsertProgress = async (progressData: Partial<ReadingProgressInsert>) => {
    if (!user || !passageId) return;

    const updated = await withErrorLog('updating reading progress', () =>
      readingProgressRepository.upsertProgress(user.id, passageId, progressData)
    );
    setProgress(updated);
  };

  const updateProgress = async (id: string, progressData: Partial<ReadingProgressInsert>) => {
    const updated = await withErrorLog('updating reading progress', () =>
      readingProgressRepository.updateProgress(id, progressData)
    );
    setProgress(updated);
  };

  const deleteProgress = async (id: string) => {
    await withErrorLog('deleting reading progress', () =>
      readingProgressRepository.deleteProgress(id)
    );
    setProgress(null);
  };

  return {
    progress: data.progress,
    allProgress: data.allProgress,
    isLoading,
    upsertProgress,
    updateProgress,
    deleteProgress,
  };
}
