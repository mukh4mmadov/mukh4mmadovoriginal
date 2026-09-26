import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

function redirectAndClearState(url) {
  const response = NextResponse.redirect(url);
  response.cookies.set('oauth-redirect', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/callback',
    maxAge: 0,
  });
  return response;
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const redirect = getSafeRedirectPath(request.cookies.get('oauth-redirect')?.value)
    || getSafeRedirectPath(searchParams.get('redirect'));

  if (error) {
    const url = new URL(`${origin}/login`, request.url);
    url.searchParams.set('error', error);
    if (errorDescription) {
      url.searchParams.set('error_description', errorDescription);
    }
    if (redirect) url.searchParams.set('redirect', redirect);
    return redirectAndClearState(url.toString());
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
          const completeProfileUrl = new URL(`${origin}/complete-profile`, request.url);
          if (redirect) completeProfileUrl.searchParams.set('redirect', redirect);
          return redirectAndClearState(completeProfileUrl.toString());
        }
      }

      return redirectAndClearState(new URL(redirect || '/', origin).toString());
    } catch (err) {
      console.error('Auth callback error:', err);
      const url = new URL(`${origin}/login`, request.url);
      url.searchParams.set('error', 'authentication_failed');
      url.searchParams.set('error_description', 'Failed to complete authentication');
      if (redirect) url.searchParams.set('redirect', redirect);
      return redirectAndClearState(url.toString());
    }
  }

  const url = new URL(`${origin}/login`, request.url);
  url.searchParams.set('error', 'no_code');
  url.searchParams.set('error_description', 'Authentication code not provided');
  return redirectAndClearState(url.toString());
}
