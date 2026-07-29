import { supabase } from '../client';
import {
  SavedQuote,
  SavedQuoteInsert,
} from '../models';

export class SavedQuotesRepository {
  /**
   * Get saved quotes for a user
   */
  async getSavedQuotes(userId: string): Promise<SavedQuote[]> {
    const { data, error } = await supabase
      .from('saved_quotes')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if a quote is saved
   */
  async isQuoteSaved(userId: string, quoteId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('saved_quotes')
      .select('id')
      .eq('user_id', userId)
      .eq('quote_id', quoteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }

    return !!data;
  }

  /**
   * Save a quote
   */
  async saveQuote(quote: SavedQuoteInsert): Promise<SavedQuote> {
    const { data, error } = await supabase
      .from('saved_quotes')
      .insert(quote)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Unsave a quote
   */
  async unsaveQuote(userId: string, quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_quotes')
      .delete()
      .eq('user_id', userId)
      .eq('quote_id', quoteId);

    if (error) throw error;
  }

  /**
   * Toggle quote saved status
   */
  async toggleQuote(userId: string, quote: Omit<SavedQuoteInsert, 'user_id'>): Promise<SavedQuote | null> {
    const isSaved = await this.isQuoteSaved(userId, quote.quote_id);

    if (isSaved) {
      await this.unsaveQuote(userId, quote.quote_id);
      return null;
    } else {
      return this.saveQuote({ ...quote, user_id: userId });
    }
  }

  /**
   * Batch save quotes
   */
  async batchSaveQuotes(quotes: SavedQuoteInsert[]): Promise<SavedQuote[]> {
    const { data, error } = await supabase
      .from('saved_quotes')
      .insert(quotes)
      .select();

    if (error) throw error;
    return data || [];
  }
}

export const savedQuotesRepository = new SavedQuotesRepository();
