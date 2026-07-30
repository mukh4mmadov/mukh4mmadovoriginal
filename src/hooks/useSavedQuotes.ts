import { savedQuotesRepository } from '@/lib/supabase/repositories';
import { SavedQuote } from '@/lib/supabase/models';
import { analyticsService } from '@/lib/analytics/analytics.service';
import { useUserResource, withErrorLog } from './useUserResource';

type QuoteInput = Omit<SavedQuote, 'user_id' | 'id' | 'saved_at'>;

export function useSavedQuotes() {
  const { user, data: quotes, setData: setQuotes, isLoading } = useUserResource<SavedQuote[]>(
    [],
    (currentUser) => savedQuotesRepository.getSavedQuotes(currentUser.id),
    { label: 'saved quotes' }
  );

  const isQuoteSaved = async (quoteId: string): Promise<boolean> => {
    if (!user) return false;
    return savedQuotesRepository.isQuoteSaved(user.id, quoteId);
  };

  const saveQuote = async (quote: QuoteInput) => {
    if (!user) return;

    const saved = await withErrorLog('saving quote', () =>
      savedQuotesRepository.saveQuote({ ...quote, user_id: user.id })
    );
    setQuotes((prev) => [saved, ...prev]);
    await analyticsService.trackQuoteSaved(user.id, saved.quote_id);
    return saved;
  };

  const unsaveQuote = async (quoteId: string) => {
    if (!user) return;

    await withErrorLog('unsaving quote', () => savedQuotesRepository.unsaveQuote(user.id, quoteId));
    setQuotes((prev) => prev.filter((q) => q.quote_id !== quoteId));
  };

  const toggleQuote = async (quote: QuoteInput) => {
    if (!user) return null;

    const result = await withErrorLog('toggling quote', () =>
      savedQuotesRepository.toggleQuote(user.id, quote)
    );
    if (result) {
      setQuotes((prev) => [result, ...prev]);
    } else {
      setQuotes((prev) => prev.filter((q) => q.quote_id !== quote.quote_id));
    }
    return result;
  };

  return {
    quotes,
    isLoading,
    isQuoteSaved,
    saveQuote,
    unsaveQuote,
    toggleQuote,
  };
}
