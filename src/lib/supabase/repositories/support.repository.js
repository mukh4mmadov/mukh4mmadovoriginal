import { supabase } from '../client';

export const supportRepository = {
  async getSupportMessages(userId) {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAllSupportChats() {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        *,
        profiles:user_id (full_name, email, username)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async sendSupportMessage(userId, message, isAdmin = false, adminId = null) {
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        user_id: userId,
        admin_id: adminId,
        message,
        is_from_admin: isAdmin,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markMessagesAsRead(userId) {
    const { error } = await supabase.rpc('mark_support_messages_read', {
      p_user_id: userId,
    });

    if (error) throw error;
  },

  async getUnreadMessageCount(userId) {
    const { count, error } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_from_admin', true)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  subscribeToSupportMessages(userId, callback) {
    return supabase
      .channel('support-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callback(payload)
      )
      .subscribe();
  },
};