import Link from 'next/link';
import type { ReactNode } from 'react';
import type { AdminSession } from '@/lib/contracts/types';

/* The admin nav. Every entry maps to a screen from the handoff. */
const NAV = [
  { href: '/customers', label: 'Users' },
  { href: '/', label: 'Dashboard' },
  { href: '/prompts', label: 'Prompts' },
  { href: '/models', label: 'Models' },
  { href: '/trips', label: 'Trips' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/content-review', label: 'Content review' },
  { href: '/connectors', label: 'Connected assistants' },
  { href: '/commerce', label: 'Commerce' },
  { href: '/affiliates', label: 'Affiliates' },
  { href: '/support', label: 'Support' },
  { href: '/admins', label: 'Admins' },
  { href: '/audit', label: 'Audit' },
];

export function AppShell({
  session,
  children,
}: {
  session: AdminSession;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav
        aria-label="Admin sections"
        style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--brand-primary-deep)',
          color: '#fff',
          padding: 'var(--space-6) var(--space-4)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-6)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/yaycay-wordmark.png"
            alt="Yaycay Admin"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 180,
              height: 'auto',
            }}
          />
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.85,
              marginTop: 'var(--space-1)',
            }}
          >
            Admin
          </span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV.map((item) => (
            <li key={item.href} style={{ marginBottom: 'var(--space-1)' }}>
              <Link
                href={item.href}
                style={{
                  display: 'block',
                  padding: 'var(--space-3)',
                  minHeight: 'var(--tap-min)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-6)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-raised)',
          }}
        >
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {session.email}
          </span>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              style={{
                minHeight: 'var(--tap-min)',
                padding: '0 var(--space-4)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </form>
        </header>
        <main style={{ padding: 'var(--space-8)', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
