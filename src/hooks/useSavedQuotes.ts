import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { savedQuotesRepository } from '@/lib/supabase/repositories';
import { SavedQuote } from '@/lib/supabase/models';
import { analyticsService } from '@/lib/analytics/analytics.service';

export function useSavedQuotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setQuotes([]);
      setIsLoading(false);
      return;
    }

    const loadQuotes = async () => {
      setIsLoading(true);
      try {
        const data = await savedQuotesRepository.getSavedQuotes(user.id);
        setQuotes(data);
      } catch (error) {
        console.error('Error loading saved quotes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotes();
  }, [user]);

  const isQuoteSaved = async (quoteId: string): Promise<boolean> => {
    if (!user) return false;
    return savedQuotesRepository.isQuoteSaved(user.id, quoteId);
  };

  const saveQuote = async (quote: Omit<SavedQuote, 'user_id' | 'id' | 'saved_at'>) => {
    if (!user) return;

    try {
      const saved = await savedQuotesRepository.saveQuote({
        ...quote,
        user_id: user.id,
      });
      setQuotes((prev) => [saved, ...prev]);
      await analyticsService.trackQuoteSaved(user.id, saved.quote_id);
      return saved;
    } catch (error) {
      console.error('Error saving quote:', error);
      throw error;
    }
  };

  const unsaveQuote = async (quoteId: string) => {
    if (!user) return;

    try {
      await savedQuotesRepository.unsaveQuote(user.id, quoteId);
      setQuotes((prev) => prev.filter((q) => q.quote_id !== quoteId));
    } catch (error) {
      console.error('Error unsaving quote:', error);
      throw error;
    }
  };

  const toggleQuote = async (quote: Omit<SavedQuote, 'user_id' | 'id' | 'saved_at'>) => {
    if (!user) return null;

    try {
      const result = await savedQuotesRepository.toggleQuote(user.id, quote);
      if (result) {
        setQuotes((prev) => [result, ...prev]);
      } else {
        setQuotes((prev) => prev.filter((q) => q.quote_id !== quote.quote_id));
      }
      return result;
    } catch (error) {
      console.error('Error toggling quote:', error);
      throw error;
    }
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
