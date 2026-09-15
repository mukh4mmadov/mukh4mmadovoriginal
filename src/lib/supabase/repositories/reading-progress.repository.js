import { supabase } from '../client';
import {
  ReadingProgress,
  ReadingProgressInsert,
  ReadingProgressUpdate,
} from '../models';

export class ReadingProgressRepository {
  /**
   * Get reading progress for a user and passage
   */
  async getProgress(userId, passageId) {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('passage_id', passageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * Get all reading progress for a user
   */
  async getAllProgress(userId) {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error in getAllProgress:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Create or update reading progress
   */
  async upsertProgress(
    userId,
    passageId,
    progress
  ) {
    const { data, error } = await supabase
      .from('reading_progress')
      .upsert({
        user_id: userId,
        passage_id: passageId,
        ...progress,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update reading progress
   */
  async updateProgress(
    id,
    updates
  ) {
    const { data, error } = await supabase
      .from('reading_progress')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete reading progress
   */
  async deleteProgress(id) {
    const { error } = await supabase
      .from('reading_progress')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Batch update multiple progress records
   */
  async batchUpdateProgress(updates) {
    const promises = updates.map(({ id, data }) =>
      this.updateProgress(id, data)
    );
    await Promise.all(promises);
  }
}

export const readingProgressRepository = new ReadingProgressRepository();
