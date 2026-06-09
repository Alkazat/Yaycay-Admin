'use client';

import { useEffect, useState } from 'react';
import {
  getBrowserSupabase,
  isBrowserSupabaseConfigured,
} from '@/lib/supabase/browser';

type Mode = 'loading' | 'email' | 'sent' | 'enroll' | 'verify' | 'configerror';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-3)',
  minHeight: 'var(--tap-min)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '1rem',
  background: 'var(--surface)',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-6)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--brand-cta)',
  color: 'var(--ink)',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
  marginTop: 'var(--space-3)',
};

/*
 * The admin sign-in flow:
 *   1. Enter email -> Supabase emails a magic link.
 *   2. Clicking the link returns here signed in (first factor).
 *   3. Enter the 6-digit code from Google Authenticator (TOTP). First time, we
 *      enroll the authenticator with a QR code; after that we just verify.
 * requireAdmin() then needs admin role + verified MFA (AAL2) for any screen.
 */
export function SignIn() {
  const [mode, setMode] = useState<Mode>('loading');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decide the starting step from the current session + MFA state.
  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) {
      setMode('configerror');
      return;
    }
    const supabase = getBrowserSupabase();
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setMode('email');
        return;
      }
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === 'aal2') {
        window.location.href = '/';
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        setFactorId(totp.id);
        setMode('verify');
      } else {
        await beginEnroll(supabase);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function beginEnroll(supabase = getBrowserSupabase()) {
    setError(null);
    const { data, error: err } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    if (err || !data) {
      setError(err?.message ?? 'Could not start authenticator setup.');
      setMode('verify');
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setMode('enroll');
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setMode('sent');
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (cErr || !challenge) {
      setBusy(false);
      setError(cErr?.message ?? 'Could not start the code check.');
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    setBusy(false);
    if (vErr) setError(vErr.message);
    else window.location.href = '/';
  }

  if (mode === 'loading') {
    return <p style={{ color: 'var(--muted)' }}>Loading...</p>;
  }

  if (mode === 'configerror') {
    return (
      <p style={{ color: 'var(--muted)' }}>
        Sign-in is not configured yet. Set the Supabase values in the
        environment. (You will sign in with an email magic link, then a 2FA
        code.)
      </p>
    );
  }

  if (mode === 'sent') {
    return (
      <p>
        Check <strong>{email}</strong> for a sign-in link. Open it on this
        device, then you will enter your 2FA code.
      </p>
    );
  }

  if (mode === 'email') {
    return (
      <form onSubmit={sendLink}>
        <p style={{ marginTop: 0 }}>
          Enter your admin email for a magic link. You will then enter a 2FA
          code from your authenticator app.
        </p>
        <input
          type="email"
          required
          placeholder="you@yaycay.ai"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" disabled={busy} style={buttonStyle}>
          {busy ? 'Sending...' : 'Send magic link'}
        </button>
        {error ? <p style={{ color: 'var(--alert)' }}>{error}</p> : null}
      </form>
    );
  }

  // enroll or verify both collect a 6-digit code
  return (
    <form onSubmit={verifyCode}>
      {mode === 'enroll' && qr ? (
        <>
          <p style={{ marginTop: 0 }}>
            First time: scan this with Google Authenticator, then enter the
            6-digit code it shows.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="Authenticator QR code"
            width={180}
            height={180}
            style={{ display: 'block', margin: '0 auto var(--space-3)' }}
          />
        </>
      ) : (
        <p style={{ marginTop: 0 }}>
          Enter the 6-digit code from your authenticator app.
        </p>
      )}
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={inputStyle}
      />
      <button type="submit" disabled={busy} style={buttonStyle}>
        {busy ? 'Checking...' : 'Verify and sign in'}
      </button>
      {error ? <p style={{ color: 'var(--alert)' }}>{error}</p> : null}
    </form>
  );
}
