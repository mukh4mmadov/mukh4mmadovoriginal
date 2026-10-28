import { supabase } from "../client";

const TABLE = "listening_attempts";
const fromRow = (row) => ({ ...row.result_data, id: row.attempt_key, completedAt: row.completed_at });

export class ListeningAttemptsRepository {
  async listForUser(userId) {
    if (!supabase || !userId) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select("attempt_key, result_data, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map(fromRow);
  }

  async upsertMany(userId, attempts) {
    if (!supabase || !userId || !Array.isArray(attempts) || attempts.length === 0) return [];
    const rows = attempts.map((attempt) => ({
      user_id: userId,
      attempt_key: attempt.id,
      test_slug: attempt.testSlug,
      score: attempt.score,
      total: attempt.total,
      completed_at: attempt.completedAt,
      result_data: attempt,
    }));
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(rows, { onConflict: "user_id,attempt_key" })
      .select("attempt_key, result_data, completed_at");
    if (error) throw error;
    return (data || []).map(fromRow);
  }
}

export const listeningAttemptsRepository = new ListeningAttemptsRepository();
