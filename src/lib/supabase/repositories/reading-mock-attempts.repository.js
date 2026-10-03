import { supabase } from "../client";

const TABLE = "reading_mock_attempts";

export class ReadingMockAttemptsRepository {
  async listForUser(userId) {
    if (!supabase || !userId) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select("attempt_key, result_data, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []).map((row) => ({ ...row.result_data, id: row.attempt_key, completedAt: row.completed_at }));
  }

  async upsertMany(userId, results) {
    if (!supabase || !userId || !Array.isArray(results) || results.length === 0) return [];
    const rows = results.map((result) => ({
      user_id: userId,
      attempt_key: result.id,
      completed_at: result.completedAt,
      result_data: result,
    }));
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(rows, { onConflict: "user_id,attempt_key" })
      .select("attempt_key, result_data, completed_at");
    if (error) throw error;
    return (data || []).map((row) => ({ ...row.result_data, id: row.attempt_key, completedAt: row.completed_at }));
  }
}

export const readingMockAttemptsRepository = new ReadingMockAttemptsRepository();
