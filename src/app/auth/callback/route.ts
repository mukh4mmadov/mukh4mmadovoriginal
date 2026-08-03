import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
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
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
