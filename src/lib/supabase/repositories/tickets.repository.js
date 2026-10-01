import { supabase } from "../client";

const TICKETS = "support_tickets";
const MESSAGES = "support_ticket_messages";
const OWNER_EMBED = "owner:profiles!support_tickets_owner_id_fkey(full_name, username, email)";
const SENDER_EMBED = "sender:profiles!support_ticket_messages_sender_id_fkey(full_name, username, email)";

function requireClient() {
  if (!supabase) throw new Error("Support is unavailable because Supabase is not configured.");
  return supabase;
}

export function validateTicketInput(input) {
  const errors = {};
  const required = (field, max, label) => {
    const value = String(input[field] ?? "").trim();
    if (!value) errors[field] = `${label} is required.`;
    else if (value.length > max) errors[field] = `${label} must be ${max} characters or fewer.`;
  };
  required("subject", 200, "Subject");
  required("body", 10000, "Message");
  for (const [field, max, label] of [["reproduction_steps", 10000, "Steps"], ["expected_behavior", 5000, "Expected behavior"], ["actual_behavior", 5000, "Actual behavior"], ["page_url", 2048, "Page URL"]]) {
    if (String(input[field] ?? "").length > max) errors[field] = `${label} must be ${max} characters or fewer.`;
  }
  if (!["bug", "feature", "incorrect_answer", "general", "support"].includes(input.category)) errors.category = "Choose a valid category.";
  if (!["low", "medium", "high", "critical"].includes(input.severity)) errors.severity = "Choose a valid severity.";
  return errors;
}

export const ticketsRepository = {
  async createTicket(input, user, profile, idempotencyKey) {
    const client = requireClient();
    const ticket = {
      owner_id: user.id,
      contact_name: profile?.full_name || user.email || "Learner",
      contact_email: user.email || "",
      category: input.category,
      severity: input.severity,
      subject: input.subject.trim(),
      reproduction_steps: input.reproduction_steps.trim() || null,
      expected_behavior: input.expected_behavior.trim() || null,
      actual_behavior: input.actual_behavior.trim() || null,
      page_url: input.page_url || null,
      idempotency_key: idempotencyKey,
    };
    const { data, error } = await client.from(TICKETS).insert(ticket).select("*").single();
    if (!error) return data;
    // If the insert committed but its response was lost, the same form key
    // finds the existing ticket instead of creating a duplicate.
    const { data: existing, error: lookupError } = await client.from(TICKETS).select("*")
      .eq("owner_id", user.id).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (!lookupError && existing) return existing;
    throw error;
  },

  async addOpeningMessage(ticketId, userId, body, idempotencyKey) {
    const client = requireClient();
    const { data, error } = await client.from(MESSAGES).insert({
      ticket_id: ticketId, sender_id: userId, sender_type: "learner", body: body.trim(), idempotency_key: idempotencyKey,
    }).select("*").single();
    if (!error) return data;
    const { data: existing, error: lookupError } = await client.from(MESSAGES).select("*")
      .eq("ticket_id", ticketId).eq("sender_id", userId).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (!lookupError && existing) return existing;
    throw error;
  },

  async listLearnerTickets(userId) {
    const { data, error } = await requireClient().from(TICKETS).select(`*, messages:${MESSAGES}(*)`)
      .eq("owner_id", userId).order("updated_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async reply(ticketId, body, idempotencyKey) {
    const { data, error } = await requireClient().rpc("reply_to_support_ticket", {
      p_ticket_id: ticketId, p_body: body, p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    return data;
  },

  async listAdminTickets({ status, category }) {
    let query = requireClient().from(TICKETS).select(`*, ${OWNER_EMBED}, messages:${MESSAGES}(*, ${SENDER_EMBED})`)
      .order("updated_at", { ascending: false }).limit(200);
    if (status !== "all") query = query.eq("status", status);
    if (category !== "all") query = query.eq("category", category);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async addAdminMessage(ticketId, adminId, body, idempotencyKey) {
    const client = requireClient();
    const { data, error } = await client.from(MESSAGES).insert({
      ticket_id: ticketId, sender_id: adminId, sender_type: "admin", body: body.trim(), idempotency_key: idempotencyKey,
    }).select("*").single();
    if (!error) return data;
    const { data: existing, error: lookupError } = await client.from(MESSAGES).select("*")
      .eq("ticket_id", ticketId).eq("sender_id", adminId).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (!lookupError && existing) return existing;
    throw error;
  },

  async updateTicket(ticketId, values) {
    const { data, error } = await requireClient().from(TICKETS).update(values).eq("id", ticketId).select("*").single();
    if (error) throw error;
    return data;
  },

  async listAdmins() {
    const { data, error } = await requireClient().from("profiles").select("id, full_name, username, email").eq("is_admin", true).order("full_name");
    if (error) throw error;
    return data || [];
  },
};
