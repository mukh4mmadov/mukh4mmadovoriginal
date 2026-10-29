import { supabase } from "@/lib/supabase/client";
import { premiumPrice } from "@/lib/writing/premium.mjs";

const COLUMNS = "id, code, essays, price_uzs, status, feedback, admin_note, created_at, approved_at, completed_at";

function client() {
  if (!supabase) throw new Error("AI Premium is not available right now. Please try again later.");
  return supabase;
}

// Creates an unpaid request and returns it with its payment code.
export async function createPremiumRequest(userId, essays) {
  const { data, error } = await client()
    .from("premium_writing_requests")
    .insert({ user_id: userId, essays, price_uzs: premiumPrice(essays.length) })
    .select(COLUMNS)
    .single();
  if (error) {
    console.error("Could not create premium request:", error);
    throw new Error(error.code === "42501"
      ? "You already have 5 unpaid AI Premium requests. Pay for one or cancel one first."
      : "Your AI Premium request could not be saved. Please try again.");
  }
  return data;
}

export async function listMyPremiumRequests(userId) {
  const { data, error } = await client()
    .from("premium_writing_requests")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function cancelPremiumRequest(id) {
  const { error } = await client().from("premium_writing_requests").delete().eq("id", id).eq("status", "awaiting_payment");
  if (error) throw error;
}
