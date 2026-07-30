import { supabase } from '../client';
import { maybeRow, requireRow, requireRows, runQuery } from '../queryHelpers';
import {
  AIConversation,
  AIConversationInsert,
  AIConversationUpdate,
} from '../models';

export class AIConversationsRepository {
  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<AIConversation[]> {
    return requireRows(
      supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
    );
  }

  /**
   * Get a specific conversation
   */
  async getConversation(id: string): Promise<AIConversation | null> {
    return maybeRow(
      supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  /**
   * Create conversation
   */
  async createConversation(conversation: AIConversationInsert): Promise<AIConversation> {
    return requireRow(
      supabase
        .from('ai_conversations')
        .insert(conversation)
        .select()
        .single()
    );
  }

  /**
   * Update conversation
   */
  async updateConversation(id: string, updates: AIConversationUpdate): Promise<AIConversation> {
    return requireRow(
      supabase
        .from('ai_conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  }

  /**
   * Add message to conversation
   */
  async addMessage(conversationId: string, message: any): Promise<AIConversation> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const updatedMessages = [...conversation.messages, message];
    return this.updateConversation(conversationId, { messages: updatedMessages });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(id: string): Promise<void> {
    await runQuery(
      supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id)
    );
  }

  /**
   * Delete all conversations for a user
   */
  async deleteUserConversations(userId: string): Promise<void> {
    await runQuery(
      supabase
        .from('ai_conversations')
        .delete()
        .eq('user_id', userId)
    );
  }
}

export const aiConversationsRepository = new AIConversationsRepository();
