import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { highlightsRepository } from '@/lib/supabase/repositories';
import { Highlight, HighlightInsert } from '@/lib/supabase/models';

export function useHighlights(passageId?: string) {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHighlights([]);
      setIsLoading(false);
      return;
    }

    const loadHighlights = async () => {
      setIsLoading(true);
      try {
        const data = await highlightsRepository.getHighlights(user.id, passageId);
        setHighlights(data);
      } catch (error) {
        console.error('Error loading highlights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHighlights();
  }, [user, passageId]);

  const createHighlight = async (highlight: Omit<HighlightInsert, 'user_id'>) => {
    if (!user) return;

    try {
      const created = await highlightsRepository.createHighlight({
        ...highlight,
        user_id: user.id,
      });
      setHighlights((prev) => [created, ...prev]);
      return created;
    } catch (error) {
      console.error('Error creating highlight:', error);
      throw error;
    }
  };

  const updateHighlight = async (id: string, data: Partial<HighlightInsert>) => {
    try {
      const updated = await highlightsRepository.updateHighlight(id, data);
      setHighlights((prev) => prev.map((h) => (h.id === id ? updated : h)));
      return updated;
    } catch (error) {
      console.error('Error updating highlight:', error);
      throw error;
    }
  };

  const deleteHighlight = async (id: string) => {
    try {
      await highlightsRepository.deleteHighlight(id);
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch (error) {
      console.error('Error deleting highlight:', error);
      throw error;
    }
  };

  const deletePassageHighlights = async (passageId: string) => {
    if (!user) return;

    try {
      await highlightsRepository.deletePassageHighlights(user.id, passageId);
      setHighlights((prev) => prev.filter((h) => h.passage_id !== passageId));
    } catch (error) {
      console.error('Error deleting passage highlights:', error);
      throw error;
    }
  };

  return {
    highlights,
    isLoading,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    deletePassageHighlights,
  };
}
