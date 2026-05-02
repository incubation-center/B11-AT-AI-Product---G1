import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/onboarding'];
const BETTER_AUTH_SESSION_COOKIE_KEYS = ['better-auth.session_token', 'session_token'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasBetterAuthSessionCookie = request.cookies
    .getAll()
    .some((cookie) =>
      BETTER_AUTH_SESSION_COOKIE_KEYS.some((key) => cookie.name.includes(key)),
    );
  const isAuthenticated = hasBetterAuthSessionCookie;

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
