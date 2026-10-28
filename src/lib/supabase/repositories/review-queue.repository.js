import { supabase } from "../client";

const TABLE = "review_queue_items";

export class ReviewQueueRepository {
  async listForUser(userId) {
    if (!supabase || !userId) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select("item_id, data, reviewed, removed_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(500);
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

  async setReviewed(userId, itemId, reviewed) {
    if (!supabase || !userId) return;
    const { error } = await supabase
      .from(TABLE)
      .update({ reviewed, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("item_id", itemId);
    if (error) throw error;
  }

  // Removal keeps a tombstone so older copies on other devices stay removed.
  async remove(userId, itemIds = null) {
    if (!supabase || !userId) return;
    const now = new Date().toISOString();
    let query = supabase.from(TABLE).update({ removed_at: now, reviewed: false, updated_at: now }).eq("user_id", userId).is("removed_at", null);
    if (itemIds) query = query.in("item_id", itemIds);
    const { error } = await query;
    if (error) throw error;
  }
}

export const reviewQueueRepository = new ReviewQueueRepository();
