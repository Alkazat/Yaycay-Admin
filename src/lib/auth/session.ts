import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { config, isSupabaseConfigured } from '@/lib/config';
import type { AdminSession } from '@/lib/contracts/types';
import { evaluateAccess } from '@/lib/auth/guard';

/*
 * Resolves the current admin session.
 *
 * Real path: read the Supabase JWT from cookies, confirm the `admin` role and
 * that MFA has been verified this session (the model context requires a 2FA
 * code on every sign-in; AAL2 stands in for that here).
 *
 * Dev path: when Supabase is not configured and ADMIN_DEV_BYPASS=true, grant a
 * stub admin session so screens can be built against the local data layer.
 */

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) {
    if (config.devBypass) {
      return {
        userId: 'dev-admin',
        email: 'dev-admin@yaycay.local',
        role: 'admin',
        mfaVerified: true,
      };
    }
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    config.supabase.publicUrl,
    config.supabase.anonKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          /* read-only in this context */
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // MFA: require AAL2 for this session (a verified second factor).
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const mfaVerified = aal?.currentLevel === 'aal2';

  const role = (user.app_metadata?.role as AdminSession['role']) ?? 'user';

  return {
    userId: user.id,
    email: user.email ?? '',
    role,
    mfaVerified,
  };
}

/**
 * Server-side guard for every protected route/segment. Redirects to the
 * appropriate place when access is denied, otherwise returns the session.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  const decision = evaluateAccess(session);

  if (!decision.allowed) {
    if (decision.reason === 'mfa-required') {
      redirect('/login?step=mfa');
    }
    if (decision.reason === 'not-admin') {
      redirect('/login?denied=not-admin');
    }
    redirect('/login');
  }

  return session as AdminSession;
}
