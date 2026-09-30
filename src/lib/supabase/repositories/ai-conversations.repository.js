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

  async saveConversation({ userId, title, messages }) {
    const { data: existing, error: lookupError } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (existing) {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ messages, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', userId);
      if (error) throw error;
      return existing.id;
    }

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: userId, title, messages })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },
};
