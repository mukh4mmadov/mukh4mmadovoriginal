import webpush from "web-push";
import { requireAdmin, serviceClient } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const clean = (value, limit) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, limit) : "");

// Sends one push notification from an administrator to every learner who
// turned on notifications (or to one learner when userId is given).
export async function POST(request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const title = clean(body?.title, 80);
  const message = clean(body?.body, 240);
  const url = clean(body?.url, 300);
  if (!title || !message) return Response.json({ error: "Write a title and a message." }, { status: 400 });
  if (url && !/^\/(?!\/)/.test(url)) return Response.json({ error: "The link must be a page on this site, starting with /." }, { status: 400 });

  const supabase = serviceClient();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!supabase || !publicKey || !privateKey) return Response.json({ error: "Push notifications are not configured on the server." }, { status: 503 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://mukh4mmadovoriginal.vercel.app", publicKey, privateKey);

  let query = supabase.from("push_subscriptions").select("id, subscription").limit(5000);
  if (typeof body?.userId === "string" && body.userId) query = query.eq("user_id", body.userId);
  const { data: subscriptions, error } = await query;
  if (error) return Response.json({ error: "Could not load subscribers." }, { status: 500 });

  const payload = JSON.stringify({ title, body: message, url: url || "/home" });
  let sent = 0, removed = 0, failed = 0;
  for (let index = 0; index < subscriptions.length; index += 10) {
    const results = await Promise.all(subscriptions.slice(index, index + 10).map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload, { TTL: 60 * 60 * 24 });
        return "sent";
      } catch (sendError) {
        if (sendError.statusCode === 404 || sendError.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", row.id);
          return "removed";
        }
        return "failed";
      }
    }));
    for (const result of results) {
      if (result === "sent") sent += 1; else if (result === "removed") removed += 1; else failed += 1;
    }
  }
  return Response.json({ recipients: subscriptions.length, sent, removed, failed });
}
