import { supabase } from "../client";

const TABLE = "vocabulary_items";

export class VocabularyRepository {
  async listForUser(userId) {
    if (!supabase || !userId) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select("item_id, data, removed_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return data || [];
  }

  async upsertMany(userId, rows) {
    if (!supabase || !userId || !Array.isArray(rows) || rows.length === 0) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from(TABLE)
      .upsert(rows.map((row) => ({ ...row, user_id: userId, updated_at: now })), { onConflict: "user_id,item_id" });
    if (error) throw error;
  }

  // Removal keeps a tombstone so older copies on other devices stay removed.
  async remove(userId, itemId) {
    if (!supabase || !userId) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from(TABLE)
      .update({ removed_at: now, updated_at: now })
      .eq("user_id", userId)
      .eq("item_id", itemId);
    if (error) throw error;
  }
}

export const vocabularyRepository = new VocabularyRepository();
