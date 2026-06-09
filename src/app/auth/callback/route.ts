import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { config, isSupabaseConfigured } from '@/lib/config';

/*
 * Magic-link landing. Supabase emails a link back to here with a one-time
 * `code`; we exchange it for a session (sets the auth cookies), then send the
 * admin to the 2FA step. requireAdmin() still enforces admin role + AAL2 after.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code && isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      config.supabase.publicUrl,
      config.supabase.anonKey,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (
            toSet: { name: string; value: string; options?: CookieOptions }[],
          ) =>
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            ),
        },
      },
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/login?step=mfa`);
}
