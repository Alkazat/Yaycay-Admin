import { Card } from '@/components/ui';
import { SignIn } from './SignIn';

/*
 * Sign-in entry. Supabase email magic-link PLUS a one-time 2FA code on every
 * sign-in (model context section 6); MFA is mandatory for admins. The
 * interactive flow lives in the SignIn client component.
 */
export default function LoginPage() {
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
        <Card title="Sign in">
          <SignIn />
        </Card>
      </div>
    </main>
  );
}
