import { supabase } from "@/lib/supabase/client";

const BUCKET = "donation-proofs";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export const donationSupportRepository = {
  async listMine() {
    const client = requireClient();
    const { data, error } = await client.from("donation_conversations")
      .select("id,user_id,status,created_at,donation_messages(id,sender_id,is_from_admin,body,attachment_path,created_at)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async submitProof(userId, file) {
    const client = requireClient();
    const { data: conversation, error: conversationError } = await client.from("donation_conversations")
      .insert({ user_id: userId }).select("id").single();
    if (conversationError) throw conversationError;
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${conversation.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      await client.from("donation_conversations").delete().eq("id", conversation.id);
      throw uploadError;
    }
    const { error: messageError } = await client.from("donation_messages").insert({
      conversation_id: conversation.id,
      sender_id: userId,
      body: "",
      attachment_path: path,
    });
    if (messageError) {
      await client.storage.from(BUCKET).remove([path]);
      await client.from("donation_conversations").delete().eq("id", conversation.id);
      throw messageError;
    }
    return conversation.id;
  },

  async sendMessage(conversationId, userId, body, isAdmin = false) {
    const { data, error } = await requireClient().from("donation_messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      is_from_admin: isAdmin,
      body: body.trim(),
    }).select("id,sender_id,is_from_admin,body,attachment_path,created_at").single();
    if (error) throw error;
    return data;
  },

  async listAdmin() {
    const { data, error } = await requireClient().from("donation_conversations")
      .select("id,user_id,status,created_at,owner:profiles!donation_conversations_user_id_fkey(full_name,username,email),donation_messages(id,sender_id,is_from_admin,body,attachment_path,created_at)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async setStatus(conversationId, status) {
    const { error } = await requireClient().from("donation_conversations").update({ status }).eq("id", conversationId);
    if (error) throw error;
  },

  async signedImage(path) {
    const { data, error } = await requireClient().storage.from(BUCKET).createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  },
};
