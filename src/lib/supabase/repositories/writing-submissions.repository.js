import { supabase } from "../client";

export const writingSubmissionsRepository = {
  async listForUser(userId, limit = 30) {
    if (!supabase || !userId) return [];
    const { data, error } = await supabase
      .from("writing_submissions")
      .select("id, task_slug, task_number, essay, word_count, time_spent_seconds, overall_band, feedback, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
