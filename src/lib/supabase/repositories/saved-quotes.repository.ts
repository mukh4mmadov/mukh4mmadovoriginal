import { supabase } from '../client';
import { requireRow, requireRows, rowExists, runQuery } from '../queryHelpers';
import {
  SavedQuote,
  SavedQuoteInsert,
} from '../models';

export class SavedQuotesRepository {
  /**
   * Get saved quotes for a user
   */
  async getSavedQuotes(userId: string): Promise<SavedQuote[]> {
    return requireRows(
      supabase
        .from('saved_quotes')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false })
    );
  }

  /**
   * Check if a quote is saved
   */
  async isQuoteSaved(userId: string, quoteId: string): Promise<boolean> {
    return rowExists(
      supabase
        .from('saved_quotes')
        .select('id')
        .eq('user_id', userId)
        .eq('quote_id', quoteId)
        .single()
    );
  }

  /**
   * Save a quote
   */
  async saveQuote(quote: SavedQuoteInsert): Promise<SavedQuote> {
    return requireRow(
      supabase
        .from('saved_quotes')
        .insert(quote)
        .select()
        .single()
    );
  }

  /**
   * Unsave a quote
   */
  async unsaveQuote(userId: string, quoteId: string): Promise<void> {
    await runQuery(
      supabase
        .from('saved_quotes')
        .delete()
        .eq('user_id', userId)
        .eq('quote_id', quoteId)
    );
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
    return requireRows(
      supabase
        .from('saved_quotes')
        .insert(quotes)
        .select()
    );
  }
}

export const savedQuotesRepository = new SavedQuotesRepository();
