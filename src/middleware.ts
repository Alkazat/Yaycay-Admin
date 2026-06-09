import { NextResponse, type NextRequest } from 'next/server';

/*
 * Coarse edge gate (defense in depth). The authoritative check is
 * requireAdmin() in each protected server segment, which verifies the admin
 * role AND MFA. Here we only ensure that unauthenticated traffic to protected
 * paths is bounced to /login before any page work happens.
 *
 * Public paths: the login flow, Next internals, and static assets.
 */

const PUBLIC_PREFIXES = ['/login', '/api/health', '/_next', '/favicon.ico'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) =>
      pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p),
  );
}

/** Detects any Supabase auth cookie, set once a user has signed in. */
function hasAuthCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some((c) => /^sb-.*-auth-token/.test(c.name));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  // Dev bypass mirrors the server session resolver so local dev stays usable.
  const devBypass =
    process.env.ADMIN_DEV_BYPASS === 'true' &&
    process.env.NODE_ENV !== 'production';
  if (devBypass) return NextResponse.next();

  if (!hasAuthCookie(req)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
