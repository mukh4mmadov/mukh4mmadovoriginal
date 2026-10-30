import { supabase } from "@/lib/supabase/client";
import { getPack, premiumPrice } from "@/lib/writing/premium.mjs";

const COLUMNS = "id, code, essays, price_uzs, status, feedback, admin_note, created_at, approved_at, completed_at, credits_used";

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

// Bundles: credits bought in advance, then one credit per essay.
export async function getCreditBalance() {
  const { data, error } = await client().rpc("premium_credit_balance");
  if (error) return 0;
  return Number(data) || 0;
}

export async function createPremiumRequestWithCredits(essays) {
  const { data, error } = await client().rpc("create_premium_request_with_credits", { p_essays: essays });
  if (error) {
    console.error("Could not use credits:", error);
    throw new Error(error.message?.includes("not enough credits")
      ? "You don't have enough credits for this. Buy a bundle or pay for this check on Telegram."
      : "Your AI Premium request could not be saved. Please try again.");
  }
  return Array.isArray(data) ? data[0] : data;
}

const ORDER_COLUMNS = "id, code, pack, credits, price_uzs, status, admin_note, created_at, approved_at";

export async function createCreditOrder(userId, packId) {
  const pack = getPack(packId);
  if (!pack) throw new Error("Unknown bundle.");
  const { data, error } = await client()
    .from("premium_credit_orders")
    .insert({ user_id: userId, pack: pack.id, credits: pack.credits, price_uzs: pack.price })
    .select(ORDER_COLUMNS)
    .single();
  if (error) {
    console.error("Could not create credit order:", error);
    throw new Error(error.code === "42501"
      ? "You already have 3 unpaid bundle orders. Pay for one or cancel one first."
      : "Your bundle order could not be saved. Please try again.");
  }
  return data;
}

export async function listMyCreditOrders(userId) {
  const { data, error } = await client().from("premium_credit_orders").select(ORDER_COLUMNS).eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}

export async function cancelCreditOrder(id) {
  const { error } = await client().from("premium_credit_orders").delete().eq("id", id).eq("status", "awaiting_payment");
  if (error) throw error;
}
