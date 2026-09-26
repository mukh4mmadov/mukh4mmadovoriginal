import { NextResponse } from 'next/server';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

function hasValidOrigin(request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}

export async function POST(request) {
  if (!hasValidOrigin(request)) {
    return Response.json({ error: 'Invalid origin' }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const redirect = getSafeRedirectPath(payload?.redirect);
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set('oauth-redirect', redirect || '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/callback',
    maxAge: redirect ? 600 : 0,
  });
  return response;
}
