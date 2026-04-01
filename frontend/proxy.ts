import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

const PROTECTED_PREFIXES = ['/dashboard', '/onboarding'];
const BETTER_AUTH_SESSION_COOKIE_KEY = 'better-auth.session_token';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const bearerToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const hasBetterAuthSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes(BETTER_AUTH_SESSION_COOKIE_KEY));
  const isAuthenticated = Boolean(bearerToken || hasBetterAuthSessionCookie);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL('/sign-in', request.url);
    const nextPath = `${pathname}${search}`;
    signInUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
};
