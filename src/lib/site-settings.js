import { supabase } from "@/lib/supabase/client";

export const ANNOUNCEMENT_KEY = "announcement";
export const ANNOUNCEMENT_TONES = ["info", "success", "warning"];

export async function readSiteSetting(key) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_settings").select("value, updated_at").eq("key", key).maybeSingle();
  if (error) return null;
  return data ? { ...data.value, updatedAt: data.updated_at } : null;
}

export async function writeSiteSetting(key, value, userId) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: userId }, { onConflict: "key" });
  if (error) throw error;
}
