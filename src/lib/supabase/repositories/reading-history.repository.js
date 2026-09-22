import { supabase } from '../client';
import {
  ReadingHistory,
  ReadingHistoryInsert,
  ReadingHistoryUpdate,
} from '../models';

export class ReadingHistoryRepository {
  async getHistory(userId, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async getPassageHistory(userId, passageId) {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .eq('passage_id', passageId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createHistory(history) {
    const { data, error } = await supabase
      .from('reading_history')
      .insert(history)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async batchCreateHistory(histories) {
    const { data, error } = await supabase
      .from('reading_history')
      .insert(histories)
      .select();

    if (error) throw error;
    return data || [];
  }

  async deleteHistory(id) {
    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const readingHistoryRepository = new ReadingHistoryRepository();
