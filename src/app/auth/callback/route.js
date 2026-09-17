import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    // Handle OAuth errors
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
      
      // Check if user has a full_name in their profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        // If no full_name and not a guest, redirect to complete profile
        if (!profile?.full_name && !user.user_metadata?.is_guest) {
          return NextResponse.redirect(`${origin}/complete-profile`);
        }
      }

      // Supabase SSR automatically handles session persistence via cookies
      // The server client uses Next.js cookies() API which writes cookies directly
      return NextResponse.redirect(`${origin}/`);
    } catch (err) {
      console.error('Auth callback error:', err);
      const url = new URL(`${origin}/login`, request.url);
      url.searchParams.set('error', 'authentication_failed');
      url.searchParams.set('error_description', 'Failed to complete authentication');
      return NextResponse.redirect(url.toString());
    }
  }

  // No code and no error - redirect to login with message
  const url = new URL(`${origin}/login`, request.url);
  url.searchParams.set('error', 'no_code');
  url.searchParams.set('error_description', 'Authentication code not provided');
  return NextResponse.redirect(url.toString());
}
