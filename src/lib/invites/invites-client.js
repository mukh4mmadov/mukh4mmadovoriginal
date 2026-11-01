import { supabase } from "@/lib/supabase/client";
import { getDeviceId } from "@/lib/invites/invites.mjs";

function client() {
  if (!supabase) throw new Error("Invites are not available right now. Please try again later.");
  return supabase;
}

const deviceId = () => (typeof window === "undefined" ? null : getDeviceId(window.localStorage));

// { code, approved, friends: [{ id, name, status, testsDone, joinedAt }] }
export async function getMyInvite() {
  const { data, error } = await client().rpc("my_invite", { p_device: deviceId() });
  if (error) throw error;
  return data;
}

// Returns the database's answer, for example "joined" or "same_device".
export async function claimInvite(code) {
  const { data, error } = await client().rpc("claim_invite", { p_code: code, p_device: deviceId() });
  if (error) throw error;
  return data;
}

export async function adminListInvites() {
  const { data, error } = await client().rpc("admin_list_invites");
  if (error) throw error;
  return data || [];
}

export async function adminReviewInvite(id, approve, note) {
  const { data, error } = await client().rpc("admin_review_invite", { p_id: id, p_approve: approve, p_note: note || null });
  if (error) throw error;
  return data;
}
