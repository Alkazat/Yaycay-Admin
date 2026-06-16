import { PageHeader, Card, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { SubmitButton } from '@/components/SubmitButton';
import {
  listSupportSessions,
  getSupportSessionSnapshot,
  getAdminMe,
} from '@/lib/data';
import { startSupportSessionAction, endSupportSessionAction } from './actions';

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 160,
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

const primaryBtn: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-4)',
  border: '1px solid var(--brand-primary)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--brand-primary)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const endBtn: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-4)',
  border: '1px solid var(--alert)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
  color: 'var(--alert)',
  fontWeight: 700,
  cursor: 'pointer',
};

function minutesLeft(expiresAt: string): number {
  return Math.max(
    0,
    Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000),
  );
}

export default async function SupportPage() {
  const me = await getAdminMe();
  const active = (await listSupportSessions(true)).filter(
    (s) => !me || s.actorId === me.userId,
  );
  const mine = active[0] ?? null;
  const snapshot = mine ? await getSupportSessionSnapshot(mine.id) : null;

  return (
    <>
      <PageHeader
        title="Support sessions"
        subtitle="Read-only, time-boxed, audited view-as for troubleshooting a customer account."
      />
      <ApiStatusBanner />

      <Card>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          A support session lets you inspect <strong>one</strong>{' '}
          customer&apos;s account for a short window. It is{' '}
          <strong>read-only</strong> and every look is logged to the audit
          trail. No customer login link, token, or cookie is ever issued, and
          you cannot act as the customer.
        </p>
      </Card>

      {mine && snapshot ? <ActiveSession snapshot={snapshot} /> : <StartForm />}
    </>
  );
}

function StartForm() {
  return (
    <Card title="Start a support session">
      <form
        action={startSupportSessionAction}
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          name="targetEmail"
          placeholder="customer email"
          required
          style={inputStyle}
        />
        <input
          name="reason"
          placeholder="reason / ticket #"
          required
          style={inputStyle}
        />
        <SubmitButton pendingLabel="Starting..." style={primaryBtn}>
          Start session
        </SubmitButton>
      </form>
      <p
        style={{
          margin: 'var(--space-3) 0 0',
          color: 'var(--muted)',
          fontSize: '0.85rem',
        }}
      >
        Sessions default to 30 minutes and expire automatically. You may hold
        one open session at a time.
      </p>
    </Card>
  );
}

function ActiveSession({
  snapshot,
}: {
  snapshot: NonNullable<Awaited<ReturnType<typeof getSupportSessionSnapshot>>>;
}) {
  const { session, customer, profiles, trips } = snapshot;
  const remaining = minutesLeft(session.expiresAt);

  return (
    <>
      <Card>
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Badge tone="alert">VIEW-AS · READ ONLY</Badge>
          <strong>{session.targetEmail ?? session.targetUserId}</strong>
          <span style={{ color: 'var(--muted)' }}>
            reason: {session.reason}
          </span>
          <span style={{ color: 'var(--muted)' }}>
            expires in {remaining} min
          </span>
          <form action={endSupportSessionAction} style={{ marginLeft: 'auto' }}>
            <input type="hidden" name="id" value={session.id} />
            <SubmitButton pendingLabel="Ending..." style={endBtn}>
              End session
            </SubmitButton>
          </form>
        </div>
      </Card>

      <Card title="Account">
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {customer.tier ? (
            <Badge tone="info">{customer.tier}</Badge>
          ) : (
            <Badge>no tier</Badge>
          )}
          <span style={{ color: 'var(--muted)' }}>
            retention: {customer.retentionExpiresAt ?? 'disposal by default'}
          </span>
          {customer.deletionRequested ? (
            <Badge tone="alert">deletion requested</Badge>
          ) : null}
        </div>
      </Card>

      <Card title={`Profiles (${profiles.length})`}>
        {profiles.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)' }}>No profiles.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
            {profiles.map((p) => (
              <li key={p.id} style={{ marginBottom: 'var(--space-2)' }}>
                <strong>{p.name}</strong> · age {p.age} · {p.type}
                {p.interests.length > 0 ? (
                  <span style={{ color: 'var(--muted)' }}>
                    {' '}
                    · {p.interests.join(', ')}
                  </span>
                ) : null}
                {p.medical && p.medical.length > 0 ? (
                  <span style={{ marginLeft: 'var(--space-2)' }}>
                    <Badge tone="alert">medical: {p.medical.join(', ')}</Badge>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Trips (${trips.length})`}>
        {trips.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)' }}>No trips.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
            {trips.map((t) => (
              <li key={t.id} style={{ marginBottom: 'var(--space-2)' }}>
                <strong>{t.destination}</strong> · {t.status} · {t.tier}
                <span style={{ color: 'var(--muted)' }}>
                  {' '}
                  · {t.startDate || '?'} → {t.endDate || '?'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
