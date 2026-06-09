import type { ReactNode } from 'react';

/*
 * Minimal composition primitives in the Yaycay style. These are a local
 * stand-in for the shared design-system components (Button, Card, Badge,
 * Stat, ...). Replace with the shared package when it is wired in; keep the
 * prop shapes compatible so callers do not change.
 */

export function Card({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-4)',
      }}
    >
      {title ? <h2 style={{ fontSize: '1.1rem' }}>{title}</h2> : null}
      {children}
    </section>
  );
}

type BadgeTone = 'default' | 'success' | 'alert' | 'info';

const badgeColor: Record<BadgeTone, string> = {
  default: 'var(--muted)',
  success: 'var(--success)',
  alert: 'var(--alert)',
  info: 'var(--brand-accent)',
};

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.78rem',
        fontWeight: 700,
        color: '#fff',
        background: badgeColor[tone],
      }}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 'var(--space-4)',
        minWidth: 140,
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{label}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          color: 'var(--brand-primary-deep)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header style={{ marginBottom: 'var(--space-6)' }}>
      <h1 style={{ fontSize: '1.8rem' }}>{title}</h1>
      {subtitle ? (
        <p
          style={{
            color: 'var(--muted)',
            marginTop: 'calc(-1 * var(--space-2))',
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
