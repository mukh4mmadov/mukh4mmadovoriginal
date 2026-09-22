import { supabase } from '../client';
import {
  ReadingProgress,
  ReadingProgressInsert,
  ReadingProgressUpdate,
} from '../models';

export class ReadingProgressRepository {
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

  async deleteProgress(id) {
    const { error } = await supabase
      .from('reading_progress')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async batchUpdateProgress(updates) {
    const promises = updates.map(({ id, data }) =>
      this.updateProgress(id, data)
    );
    await Promise.all(promises);
  }
}

export const readingProgressRepository = new ReadingProgressRepository();
