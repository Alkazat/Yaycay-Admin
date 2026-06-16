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
    text: "Couldn't save - the request did not go through, so nothing was changed. Try again; if it persists, the backend endpoint may be unavailable or not deployed yet.",
  },
  created: { tone: 'ok', text: 'Affiliate created.' },
  status: { tone: 'ok', text: 'Affiliate status updated.' },
  updated: { tone: 'ok', text: 'Affiliate updated.' },
  archived: { tone: 'ok', text: 'Affiliate archived.' },
  sent: { tone: 'ok', text: 'Report sent to the influencer.' },
  revoked: { tone: 'ok', text: 'Connector revoked.' },
};

/** Turn a failing HTTP status into a plain-language cause. */
function statusHint(status?: string): string | null {
  if (!status) return null;
  const code = Number(status);
  if (!code || Number.isNaN(code)) {
    return 'could not reach the API (wrong base URL, or network/CORS)';
  }
  if (code === 401) return 'HTTP 401 - not signed in to the API';
  if (code === 403)
    return 'HTTP 403 - the admin token was rejected (role / MFA / scope)';
  if (code === 404)
    return 'HTTP 404 - the endpoint is not deployed at this API base';
  if (code >= 500)
    return `HTTP ${code} - the backend errored handling the request`;
  return `HTTP ${code}`;
}

export function NoticeBanner({
  notice,
  status,
  detail,
}: {
  notice?: string;
  status?: string;
  detail?: string;
}) {
  const message = notice ? MESSAGES[notice] : undefined;
  if (!message) return null;
  const hint = message.tone === 'error' ? statusHint(status) : null;
  const showDetail = message.tone === 'error' && detail;
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
        {hint ? <span style={{ fontWeight: 400 }}> ({hint})</span> : null}
      </p>
      {showDetail ? (
        <p
          style={{
            margin: 'var(--space-2) 0 0',
            fontSize: '0.8rem',
            color: 'var(--muted)',
            fontFamily: 'var(--font-body)',
            wordBreak: 'break-word',
          }}
        >
          Backend said: {detail}
        </p>
      ) : null}
    </Card>
  );
}
