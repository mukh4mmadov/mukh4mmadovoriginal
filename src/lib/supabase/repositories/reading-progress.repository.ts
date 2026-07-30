import { supabase } from '../client';
import { maybeRow, requireRow, requireRows, runQuery } from '../queryHelpers';
import {
  ReadingProgress,
  ReadingProgressInsert,
  ReadingProgressUpdate,
} from '../models';

export class ReadingProgressRepository {
  /**
   * Get reading progress for a user and passage
   */
  async getProgress(userId: string, passageId: string): Promise<ReadingProgress | null> {
    return maybeRow(
      supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('passage_id', passageId)
        .single()
    );
  }

  /**
   * Get all reading progress for a user
   */
  async getAllProgress(userId: string): Promise<ReadingProgress[]> {
    return requireRows(
      supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
    );
  }

  /**
   * Create or update reading progress
   */
  async upsertProgress(
    userId: string,
    passageId: string,
    progress: Partial<ReadingProgressInsert>
  ): Promise<ReadingProgress> {
    return requireRow(
      supabase
        .from('reading_progress')
        .upsert({
          user_id: userId,
          passage_id: passageId,
          ...progress,
        })
        .select()
        .single()
    );
  }

  /**
   * Update reading progress
   */
  async updateProgress(
    id: string,
    updates: ReadingProgressUpdate
  ): Promise<ReadingProgress> {
    return requireRow(
      supabase
        .from('reading_progress')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  }

  /**
   * Delete reading progress
   */
  async deleteProgress(id: string): Promise<void> {
    await runQuery(
      supabase
        .from('reading_progress')
        .delete()
        .eq('id', id)
    );
  }

  /**
   * Batch update multiple progress records
   */
  async batchUpdateProgress(updates: Array<{ id: string; data: ReadingProgressUpdate }>): Promise<void> {
    const promises = updates.map(({ id, data }) =>
      this.updateProgress(id, data)
    );
    await Promise.all(promises);
  }
}

export const readingProgressRepository = new ReadingProgressRepository();
