import { supabase } from '../client';
import {
  Highlight,
  HighlightInsert,
  HighlightUpdate,
} from '../models';

export class HighlightsRepository {
  /**
   * Get highlights for a user
   */
  async getHighlights(userId: string, passageId?: string): Promise<Highlight[]> {
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

  /**
   * Get a specific highlight
   */
  async getHighlight(id: string): Promise<Highlight | null> {
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

  /**
   * Create highlight
   */
  async createHighlight(highlight: HighlightInsert): Promise<Highlight> {
    const { data, error } = await supabase
      .from('highlights')
      .insert(highlight)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Batch create highlights
   */
  async batchCreateHighlights(highlights: HighlightInsert[]): Promise<Highlight[]> {
    const { data, error } = await supabase
      .from('highlights')
      .insert(highlights)
      .select();

    if (error) throw error;
    return data || [];
  }

  /**
   * Update highlight
   */
  async updateHighlight(id: string, updates: HighlightUpdate): Promise<Highlight> {
    const { data, error } = await supabase
      .from('highlights')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete highlight
   */
  async deleteHighlight(id: string): Promise<void> {
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete all highlights for a passage
   */
  async deletePassageHighlights(userId: string, passageId: string): Promise<void> {
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('user_id', userId)
      .eq('passage_id', passageId);

    if (error) throw error;
  }
}

export const highlightsRepository = new HighlightsRepository();
