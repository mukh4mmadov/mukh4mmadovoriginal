import { supabase } from '../client';

export const usersRepository = {
  async getAllUsers() {
    const { data, error } = await supabase.rpc('get_admin_user_reading_metrics');

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

    const { data: userMetrics, error: statsError } = await supabase.rpc('get_admin_user_reading_metrics');

    if (statsError) throw statsError;
    const stats = (userMetrics || []).find((item) => item.user_id === userId) || null;

    const { data: aiSummary, error: aiError } = await supabase
      .from('admin_user_ai_summary')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (aiError) throw aiError;

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
    // Scores live in metadata entries inside the answers JSON (see progressTracker).
    return (data || []).map((row) => {
      const answers = Array.isArray(row.answers) ? row.answers : [];
      const bestScore = Number(answers.find((entry) => entry?.type === '_best_score')?.value);
      const attempts = Number(answers.find((entry) => entry?.type === '_attempt_count')?.value);
      return {
        id: row.id,
        slug: row.passage_id,
        completed: Boolean(row.is_completed),
        best_score: Number.isFinite(bestScore) ? bestScore : null,
        attempts: Number.isFinite(attempts) ? attempts : null,
        total_time: Number(row.time_spent_seconds) || 0,
        updated_at: row.updated_at,
      };
    });
  },

  async getUserAIChatHistory(userId, limit = 50) {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).flatMap((conversation) => {
      const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
      return messages
        .filter((message) => message && (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
        .map((message, index) => ({
          id: `${conversation.id}-${message.id || index}`,
          role: message.role,
          message: message.content,
          created_at: typeof message.timestamp === 'number'
            ? new Date(message.timestamp).toISOString()
            : typeof message.timestamp === 'string'
              ? message.timestamp
              : conversation.created_at,
          passage_slug: conversation.title || 'Reading Coach',
          personality: null,
        }));
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
  },

  async getUserFeedbackHistory(userId) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, messages:support_ticket_messages(*)')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserSupportMessages(userId) {
    const { data, error } = await supabase.from('support_tickets')
      .select('messages:support_ticket_messages(*)').eq('owner_id', userId);
    if (error) throw error;
    return (data || []).flatMap((ticket) => ticket.messages || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  async deleteUser(userId) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },
};
