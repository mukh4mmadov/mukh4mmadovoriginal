import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: 'Sign in required' }, { status: 401 });

  let subscription;
  try {
    subscription = await request.json();
  } catch {
    return Response.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  if (
    typeof subscription?.endpoint !== 'string' ||
    !subscription.endpoint.startsWith('https://') ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return Response.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    subscription,
    last_active_at: new Date().toISOString(),
    last_notified_at: null,
  }, { onConflict: 'user_id,endpoint' });

  if (error) return Response.json({ error: 'Could not save notification preference' }, { status: 500 });
  return Response.json({ subscribed: true });
}

export async function DELETE(request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: 'Sign in required' }, { status: 401 });

  let endpoint;
  try {
    endpoint = (await request.json())?.endpoint;
  } catch {
    return Response.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) {
    return Response.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) return Response.json({ error: 'Could not remove notification preference' }, { status: 500 });
  return Response.json({ subscribed: false });
}
