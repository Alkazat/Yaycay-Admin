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
        <h1 style={{ textAlign: 'center', margin: '0 0 var(--space-4)' }}>
          <Image
            src="/brand/yaycay-wordmark.png"
            alt="Yaycay Admin"
            width={200}
            height={139}
            priority
            style={{ display: 'inline-block', height: 'auto', maxWidth: '68%' }}
          />
        </h1>
        <Card title="Sign in">
          <SignIn />
        </Card>
      </div>
    </main>
  );
}
