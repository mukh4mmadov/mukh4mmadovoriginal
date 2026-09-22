import { supabase } from '../client';
import {
  Highlight,
  HighlightInsert,
  HighlightUpdate,
} from '../models';

export class HighlightsRepository {
  async getHighlights(userId, passageId) {
    let query = supabase
      .from('highlights')
      .select('*')
      .eq('user_id', userId);

    if (passageId) {
      query = query.eq('passage_id', passageId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getHighlight(id) {
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async createHighlight(highlight) {
    const { data, error } = await supabase
      .from('highlights')
      .insert(highlight)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async batchCreateHighlights(highlights) {
    const { data, error } = await supabase
      .from('highlights')
      .insert(highlights)
      .select();

    if (error) throw error;
    return data || [];
  }

  async updateHighlight(id, updates) {
    const { data, error } = await supabase
      .from('highlights')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteHighlight(id) {
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deletePassageHighlights(userId, passageId) {
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('user_id', userId)
      .eq('passage_id', passageId);

    if (error) throw error;
  }
}

export const highlightsRepository = new HighlightsRepository();
