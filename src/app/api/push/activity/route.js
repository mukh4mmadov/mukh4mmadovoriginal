import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: 'Sign in required' }, { status: 401 });

  const { error } = await supabase
    .from('push_subscriptions')
    .update({ last_active_at: new Date().toISOString(), last_notified_at: null })
    .eq('user_id', user.id);

  if (error) return Response.json({ error: 'Could not update activity' }, { status: 500 });
  return Response.json({ updated: true });
}
