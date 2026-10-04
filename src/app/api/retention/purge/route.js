import { createClient } from '@supabase/supabase-js';
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return Response.json({ error: 'Retention cleanup is not configured' }, { status: 503 });

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: databaseCounts, error: databaseError } = await supabase.rpc('purge_expired_user_data');
  if (databaseError) return Response.json({ error: 'Could not remove expired records' }, { status: 500 });

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: proofs, error: proofQueryError } = await supabase
    .from('donation_messages')
    .select('id, attachment_path, created_at, conversation:donation_conversations!inner(id, user_id, status, resolved_at)')
    .in('conversation.status', ['confirmed', 'not_confirmed'])
    .lt('conversation.resolved_at', cutoff)
    .not('attachment_path', 'is', null)
    .order('created_at', { ascending: true })
    .limit(200);

  if (proofQueryError) return Response.json({ error: 'Could not find expired donation images' }, { status: 500 });

  let proofMessagesRemoved = 0;
  const ownedProofs = proofs.filter((row) => {
    const conversation = row.conversation;
    return conversation && row.attachment_path?.startsWith(`${conversation.user_id}/${conversation.id}/`);
  });
  for (let index = 0; index < ownedProofs.length; index += 50) {
    const batch = ownedProofs.slice(index, index + 50);
    const paths = batch.map((row) => row.attachment_path);
    const { error: storageError } = await supabase.storage.from('donation-proofs').remove(paths);
    if (storageError) continue;

    const ids = batch.map((row) => row.id);
    const { data: removedMessages, error: messageError } = await supabase
      .from('donation_messages')
      .delete()
      .in('id', ids)
      .select('id');
    if (!messageError) proofMessagesRemoved += removedMessages?.length || 0;
  }

  return Response.json({ database: databaseCounts, expiredDonationImagesRemoved: proofMessagesRemoved });
}
