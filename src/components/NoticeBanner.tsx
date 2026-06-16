import { Card } from '@/components/ui';

/*
 * A one-line result banner driven by a `?notice=` query param, set by the
 * server actions after a write. Keeps the user informed (especially when a
 * pending-BE endpoint means the write could not be saved) instead of a silent
 * no-op or a crash.
 */

const MESSAGES: Record<string, { tone: 'ok' | 'error'; text: string }> = {
  backend: {
    tone: 'error',
    text: "Couldn't save - the backend for this feature is not connected yet (endpoints pending). Nothing was changed.",
  },
  created: { tone: 'ok', text: 'Affiliate created.' },
  status: { tone: 'ok', text: 'Affiliate status updated.' },
  sent: { tone: 'ok', text: 'Report sent to the influencer.' },
  revoked: { tone: 'ok', text: 'Connector revoked.' },
};

export function NoticeBanner({ notice }: { notice?: string }) {
  const message = notice ? MESSAGES[notice] : undefined;
  if (!message) return null;
  return (
    <Card>
      <p
        style={{
          margin: 0,
          fontWeight: 600,
          color: message.tone === 'error' ? 'var(--alert)' : 'var(--success)',
        }}
      >
        {message.text}
      </p>
    </Card>
  );
}
