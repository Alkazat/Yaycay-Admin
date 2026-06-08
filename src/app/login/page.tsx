import { Card } from '@/components/ui';
import { config, isSupabaseConfigured } from '@/lib/config';

/*
 * Sign-in entry. The real flow is Supabase email magic-link PLUS a one-time
 * 2FA code on every sign-in (model context section 6); MFA is mandatory for
 * admins. This scaffold renders the two steps and the dev-bypass notice; the
 * Supabase auth calls are wired here next.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  const mfaStep = step === 'mfa';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ width: 'min(420px, 100%)' }}>
        <h1 style={{ textAlign: 'center' }}>Yaycay Admin</h1>
        <Card title={mfaStep ? 'Enter your 2FA code' : 'Sign in'}>
          {mfaStep ? (
            <p style={{ marginTop: 0 }}>
              Enter the one-time code from your authenticator to finish signing
              in. MFA is required for every admin.
            </p>
          ) : (
            <p style={{ marginTop: 0 }}>
              Enter your admin email to receive a magic link. You will then be
              asked for a one-time 2FA code.
            </p>
          )}

          {!isSupabaseConfigured() ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Supabase is not configured.{' '}
              {config.devBypass
                ? 'Dev bypass is on - a stub admin session is active.'
                : 'Set the Supabase env values, or enable ADMIN_DEV_BYPASS for local development.'}
            </p>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
