import { NextResponse, type NextRequest } from 'next/server';
import { config } from '@/lib/config';

/*
 * Sign out: clear Supabase auth cookies and return to /login.
 * The full Supabase server-side session revocation is wired here when auth
 * lands; clearing the cookies is enough to drop the session client-side.
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', config.siteUrl), {
    status: 303,
  });
  for (const cookie of req.cookies.getAll()) {
    if (/^sb-.*-auth-token/.test(cookie.name)) {
      res.cookies.delete(cookie.name);
    }
  }
  return res;
}
