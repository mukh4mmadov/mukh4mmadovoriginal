import { highlightsRepository } from '@/lib/supabase/repositories';
import { Highlight, HighlightInsert } from '@/lib/supabase/models';
import { useUserResource, withErrorLog } from './useUserResource';

export function useHighlights(passageId?: string) {
  const { user, data: highlights, setData: setHighlights, isLoading } = useUserResource<Highlight[]>(
    [],
    (currentUser) => highlightsRepository.getHighlights(currentUser.id, passageId),
    { label: 'highlights', deps: [passageId] }
  );

  const createHighlight = async (highlight: Omit<HighlightInsert, 'user_id'>) => {
    if (!user) return;

    const created = await withErrorLog('creating highlight', () =>
      highlightsRepository.createHighlight({ ...highlight, user_id: user.id })
    );
    setHighlights((prev) => [created, ...prev]);
    return created;
  };

  const updateHighlight = async (id: string, data: Partial<HighlightInsert>) => {
    const updated = await withErrorLog('updating highlight', () =>
      highlightsRepository.updateHighlight(id, data)
    );
    setHighlights((prev) => prev.map((h) => (h.id === id ? updated : h)));
    return updated;
  };

  const deleteHighlight = async (id: string) => {
    await withErrorLog('deleting highlight', () => highlightsRepository.deleteHighlight(id));
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  const deletePassageHighlights = async (passageId: string) => {
    if (!user) return;

    await withErrorLog('deleting passage highlights', () =>
      highlightsRepository.deletePassageHighlights(user.id, passageId)
    );
    setHighlights((prev) => prev.filter((h) => h.passage_id !== passageId));
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
