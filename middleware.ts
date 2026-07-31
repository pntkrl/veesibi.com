import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check Supabase auth cookie (sb-<project-ref>-auth-token)
  const supabaseCookie = request.cookies.get('sb-dunmrudgzfblxcougjln-auth-token');

  // Check legacy/demo localStorage session cookie
  const demoSession = request.cookies.get('veesibi_auth_session');

  if (supabaseCookie || demoSession) {
    return NextResponse.next();
  }

  // Also allow if there's any cookie starting with "sb-" (any Supabase project)
  const hasAnySupabaseCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && c.value
  );

  if (hasAnySupabaseCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*']
};
