import { supabase } from '../client';

export class AIConversationsRepository {
  async getConversations(userId) {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getConversation(id) {
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

  async createConversation(conversation) {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert(conversation)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateConversation(id, updates) {
    const { data, error } = await supabase
      .from('ai_conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addMessage(conversationId, message) {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const updatedMessages = [...conversation.messages, message];
    return this.updateConversation(conversationId, { messages: updatedMessages });
  }

  async deleteConversation(id) {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteUserConversations(userId) {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const aiConversationsRepository = new AIConversationsRepository();
