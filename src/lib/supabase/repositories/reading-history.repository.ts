import { supabase } from '../client';
import { requireRow, requireRows, runQuery } from '../queryHelpers';
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
    return requireRows(
      supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(offset, offset + limit - 1)
    );
  }

  /**
   * Get reading history for a specific passage
   */
  async getPassageHistory(userId: string, passageId: string): Promise<ReadingHistory[]> {
    return requireRows(
      supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', userId)
        .eq('passage_id', passageId)
        .order('completed_at', { ascending: false })
    );
  }

  /**
   * Create reading history entry
   */
  async createHistory(history: ReadingHistoryInsert): Promise<ReadingHistory> {
    return requireRow(
      supabase
        .from('reading_history')
        .insert(history)
        .select()
        .single()
    );
  }

  /**
   * Batch create reading history entries
   */
  async batchCreateHistory(histories: ReadingHistoryInsert[]): Promise<ReadingHistory[]> {
    return requireRows(
      supabase
        .from('reading_history')
        .insert(histories)
        .select()
    );
  }

  /**
   * Delete reading history entry
   */
  async deleteHistory(id: string): Promise<void> {
    await runQuery(
      supabase
        .from('reading_history')
        .delete()
        .eq('id', id)
    );
  }
}

export const readingHistoryRepository = new ReadingHistoryRepository();
