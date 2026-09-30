import { supabase } from '../client';

export const usersRepository = {
  async getAllUsers() {
    const { data, error } = await supabase
      .from('admin_user_statistics')
      .select('*')
      .order('last_activity', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserDetails(userId) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const { data: stats, error: statsError } = await supabase
      .from('admin_user_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') throw statsError;

    const { data: aiSummary, error: aiError } = await supabase
      .from('admin_user_ai_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (aiError && aiError.code !== 'PGRST116') throw aiError;

    return {
      profile,
      stats: stats || null,
      aiSummary: aiSummary || null,
    };
  },

  async getUserReadingProgress(userId) {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserAIChatHistory(userId, limit = 50) {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getUserFeedbackHistory(userId) {
    const { data, error } = await supabase
      .from('feedback_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserSupportMessages(userId) {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async deleteUser(userId) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },
};