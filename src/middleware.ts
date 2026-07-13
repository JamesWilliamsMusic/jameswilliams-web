import { NextRequest, NextResponse } from 'next/server';
import { isTokenExpired } from '@/lib/auth/tokens';

const PROTECTED_ROUTES = ['/account'];
const PROTECTED_PREFIXES = ['/exclusive/'];
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password'];

function isProtectedRoute(pathname: string): boolean {
  // Exact match for routes like /account
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return true;
  }
  // Only protect /exclusive/ subpaths (individual posts), not the /exclusive listing
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return false;
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(pathname) && accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect routes that require authentication
  if (isProtectedRoute(pathname)) {
    if (!accessToken) {
      // No access token — check if we can refresh
      if (refreshToken) {
        const refreshUrl = new URL('/api/auth/refresh', request.url);
        refreshUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(refreshUrl);
      }
      // No tokens at all — redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token exists but expired
    if (isTokenExpired(accessToken)) {
      if (refreshToken) {
        const refreshUrl = new URL('/api/auth/refresh', request.url);
        refreshUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(refreshUrl);
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes (handled by their own auth checks)
     * - static files and Next.js internals
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
