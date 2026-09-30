import { supabase } from '../client';

export const aiConversationsRepository = {
  async createConversation(conversation) {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert(conversation)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
