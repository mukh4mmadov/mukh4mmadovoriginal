import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Confirms the request comes from a signed-in administrator. Returns the
// caller's id, or a Response to send back when they are not allowed.
export async function requireAdmin(request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return { response: Response.json({ error: "Invalid origin" }, { status: 403 }) };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: Response.json({ error: "Sign in as an administrator." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return { response: Response.json({ error: "Administrators only." }, { status: 403 }) };
  return { userId: user.id };
}

// Server-only client with full database rights, for actions such as
// deleting a sign-in account that no browser client can perform.
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
