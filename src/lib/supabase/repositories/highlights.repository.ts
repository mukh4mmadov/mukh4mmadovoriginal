import { supabase } from '../client';
import { maybeRow, requireRow, requireRows, runQuery } from '../queryHelpers';
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

    return requireRows(
      query.order('created_at', { ascending: false })
    );
  }

  /**
   * Get a specific highlight
   */
  async getHighlight(id: string): Promise<Highlight | null> {
    return maybeRow(
      supabase
        .from('highlights')
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  /**
   * Create highlight
   */
  async createHighlight(highlight: HighlightInsert): Promise<Highlight> {
    return requireRow(
      supabase
        .from('highlights')
        .insert(highlight)
        .select()
        .single()
    );
  }

  /**
   * Batch create highlights
   */
  async batchCreateHighlights(highlights: HighlightInsert[]): Promise<Highlight[]> {
    return requireRows(
      supabase
        .from('highlights')
        .insert(highlights)
        .select()
    );
  }

  /**
   * Update highlight
   */
  async updateHighlight(id: string, updates: HighlightUpdate): Promise<Highlight> {
    return requireRow(
      supabase
        .from('highlights')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  }

  /**
   * Delete highlight
   */
  async deleteHighlight(id: string): Promise<void> {
    await runQuery(
      supabase
        .from('highlights')
        .delete()
        .eq('id', id)
    );
  }

  /**
   * Delete all highlights for a passage
   */
  async deletePassageHighlights(userId: string, passageId: string): Promise<void> {
    await runQuery(
      supabase
        .from('highlights')
        .delete()
        .eq('user_id', userId)
        .eq('passage_id', passageId)
    );
  }
}

export const highlightsRepository = new HighlightsRepository();
