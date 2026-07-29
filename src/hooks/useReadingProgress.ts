import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { readingProgressRepository } from '@/lib/supabase/repositories';
import { ReadingProgress, ReadingProgressInsert } from '@/lib/supabase/models';

export function useReadingProgress(passageId?: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [allProgress, setAllProgress] = useState<ReadingProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadProgress = async () => {
      setIsLoading(true);
      try {
        if (passageId) {
          const data = await readingProgressRepository.getProgress(user.id, passageId);
          setProgress(data);
        } else {
          const data = await readingProgressRepository.getAllProgress(user.id);
          setAllProgress(data);
        }
      } catch (error) {
        console.error('Error loading reading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user, passageId]);

  const upsertProgress = async (data: Partial<ReadingProgressInsert>) => {
    if (!user || !passageId) return;

    try {
      const updated = await readingProgressRepository.upsertProgress(user.id, passageId, data);
      setProgress(updated);
    } catch (error) {
      console.error('Error updating reading progress:', error);
      throw error;
    }
  };

  const updateProgress = async (id: string, data: Partial<ReadingProgressInsert>) => {
    try {
      const updated = await readingProgressRepository.updateProgress(id, data);
      setProgress(updated);
    } catch (error) {
      console.error('Error updating reading progress:', error);
      throw error;
    }
  };

  const deleteProgress = async (id: string) => {
    try {
      await readingProgressRepository.deleteProgress(id);
      setProgress(null);
    } catch (error) {
      console.error('Error deleting reading progress:', error);
      throw error;
    }
  };

  return {
    progress,
    allProgress,
    isLoading,
    upsertProgress,
    updateProgress,
    deleteProgress,
  };
}
