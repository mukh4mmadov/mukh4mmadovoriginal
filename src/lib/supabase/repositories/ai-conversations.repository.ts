import { supabase } from '../client';
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
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific conversation
   */
  async getConversation(id: string): Promise<AIConversation | null> {
    const { data, error } = await supabase
      .from('ai_conversations')
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
   * Create conversation
   */
  async createConversation(conversation: AIConversationInsert): Promise<AIConversation> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert(conversation)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update conversation
   */
  async updateConversation(id: string, updates: AIConversationUpdate): Promise<AIConversation> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete all conversations for a user
   */
  async deleteUserConversations(userId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const aiConversationsRepository = new AIConversationsRepository();
