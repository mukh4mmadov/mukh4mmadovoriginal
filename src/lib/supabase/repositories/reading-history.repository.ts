import { supabase } from '../client';
import {
  ReadingHistory,
  ReadingHistoryInsert,
  ReadingHistoryUpdate,
} from '../models';

export class ReadingHistoryRepository {
  /**
   * Get reading history for a user
   */
  async getHistory(userId: string, limit = 50, offset = 0): Promise<ReadingHistory[]> {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get reading history for a specific passage
   */
  async getPassageHistory(userId: string, passageId: string): Promise<ReadingHistory[]> {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .eq('passage_id', passageId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create reading history entry
   */
  async createHistory(history: ReadingHistoryInsert): Promise<ReadingHistory> {
    const { data, error } = await supabase
      .from('reading_history')
      .insert(history)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Batch create reading history entries
   */
  async batchCreateHistory(histories: ReadingHistoryInsert[]): Promise<ReadingHistory[]> {
    const { data, error } = await supabase
      .from('reading_history')
      .insert(histories)
      .select();

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete reading history entry
   */
  async deleteHistory(id: string): Promise<void> {
    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const readingHistoryRepository = new ReadingHistoryRepository();
