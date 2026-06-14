import Image from 'next/image';
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
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <Image
            src="/brand/yaycay-wordmark.png"
            alt="Yaycay"
            width={176}
            height={122}
            priority
            style={{ height: 'auto', display: 'inline-block', maxWidth: '62%' }}
          />
          <h1 style={{ margin: 'var(--space-2) 0 0', fontSize: '1.05rem', fontWeight: 700 }}>
            Admin console
          </h1>
        </div>
        <Card title="Sign in">
          <SignIn />
        </Card>
      </div>
    </main>
  );
}
