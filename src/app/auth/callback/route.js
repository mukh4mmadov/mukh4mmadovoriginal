import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    const url = new URL(`${origin}/login`, request.url);
    url.searchParams.set('error', error);
    if (errorDescription) {
      url.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(url.toString());
  }

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.exchangeCodeForSession(code);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (!profile?.full_name && !user.user_metadata?.is_guest) {
          return NextResponse.redirect(`${origin}/complete-profile`);
        }
      }

      return NextResponse.redirect(`${origin}/`);
    } catch (err) {
      console.error('Auth callback error:', err);
      const url = new URL(`${origin}/login`, request.url);
      url.searchParams.set('error', 'authentication_failed');
      url.searchParams.set('error_description', 'Failed to complete authentication');
      return NextResponse.redirect(url.toString());
    }
  }

  const url = new URL(`${origin}/login`, request.url);
  url.searchParams.set('error', 'no_code');
  url.searchParams.set('error_description', 'Authentication code not provided');
  return NextResponse.redirect(url.toString());
}
