import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function hasValidSecret(request) {
  const expected = process.env.CRON_SECRET || '';
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!expected || expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function GET(request) {
  if (!hasValidSecret(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return Response.json({ error: 'Push reminders are not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'https://mukh4mmadovoriginal.vercel.app',
    vapidPublicKey,
    vapidPrivateKey,
  );

  const inactiveBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: subscriptions, error: queryError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, subscription')
    .is('last_notified_at', null)
    .lt('last_active_at', inactiveBefore)
    .order('last_active_at', { ascending: true })
    .limit(1000);

  if (queryError) return Response.json({ error: 'Could not load reminder recipients' }, { status: 500 });

  let sent = 0;
  let removed = 0;
  let failed = 0;
  const payload = JSON.stringify({
    title: 'Ready for a little IELTS practice?',
    body: "It's been over 24 hours since your last visit. Continue whenever you're ready.",
    url: '/reading',
  });

  for (let index = 0; index < subscriptions.length; index += 10) {
    const batch = subscriptions.slice(index, index + 10);
    const results = await Promise.all(batch.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload, { TTL: 60 * 60 * 24 });
        const { error } = await supabase
          .from('push_subscriptions')
          .update({ last_notified_at: new Date().toISOString() })
          .eq('id', row.id);
        if (error) return 'failed';
        return 'sent';
      } catch (error) {
        const statusCode = error.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id);
          return 'removed';
        }
        return 'failed';
      }
    }));

    for (const result of results) {
      if (result === 'sent') sent += 1;
      else if (result === 'removed') removed += 1;
      else failed += 1;
    }
  }

  return Response.json({ sent, removed, failed });
}
