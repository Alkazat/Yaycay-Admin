import { PageHeader, Card, Stat, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { NoticeBanner } from '@/components/NoticeBanner';
import { listConnectors } from '@/lib/data';
import { summariseConnectors, daysSince } from '@/lib/connectors/summary';
import { revokeConnectorAction } from './actions';

const inputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

function lastUsedLabel(lastUsedAt: string | null, now: string): string {
  const days = daysSince(lastUsedAt, now);
  if (days === null) return 'never';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export default async function ConnectorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; notice?: string }>;
}) {
  const { q, notice } = await searchParams;
  const { items } = await listConnectors({ query: q });
  const now = new Date().toISOString();
  const summary = summariseConnectors(items, now);

  return (
    <>
      <PageHeader
        title="Connected assistants"
        subtitle="BYO-AI MCP connectors: the external AIs (Claude, ChatGPT, Gemini) parents have connected to their account. Read-only, with a revoke kill switch."
      />

      <ApiStatusBanner />
      <NoticeBanner notice={notice} />

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-6)',
        }}
      >
        <Stat label="Active" value={summary.active} />
        <Stat label="Can write (plan)" value={summary.withPlanScope} />
        <Stat label="Stale" value={summary.stale} />
        <Stat label="Revoked" value={summary.revoked} />
      </div>

      <Card>
        <form method="get" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="owner email or assistant"
            style={inputStyle}
          />
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
            Search
          </button>
        </form>
      </Card>

      <Card title="Connectors">
        {items.length === 0 ? (
          <p style={{ margin: 0 }}>No connected assistants.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: 'var(--space-2)' }}>Account</th>
                <th style={{ padding: 'var(--space-2)' }}>Assistant</th>
                <th style={{ padding: 'var(--space-2)' }}>Scopes</th>
                <th style={{ padding: 'var(--space-2)' }}>Last used</th>
                <th style={{ padding: 'var(--space-2)' }}>Status</th>
                <th style={{ padding: 'var(--space-2)' }} />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: 'var(--space-2)' }}>{c.ownerEmail}</td>
                  <td style={{ padding: 'var(--space-2)' }}>{c.assistant}</td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        gap: 'var(--space-1)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {c.scopes.map((s) => (
                        <Badge
                          key={s}
                          tone={s === 'yaycay.plan' ? 'alert' : 'default'}
                        >
                          {s === 'yaycay.plan' ? 'plan (write)' : 'read'}
                        </Badge>
                      ))}
                    </span>
                  </td>
                  <td
                    style={{ padding: 'var(--space-2)', color: 'var(--muted)' }}
                  >
                    {lastUsedLabel(c.lastUsedAt, now)}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    {c.status === 'active' ? (
                      <Badge tone="success">active</Badge>
                    ) : (
                      <Badge>revoked</Badge>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    {c.status === 'active' ? (
                      <form action={revokeConnectorAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          style={{
                            minHeight: 'var(--tap-min)',
                            padding: '0 var(--space-4)',
                            border: '1px solid var(--alert)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface)',
                            color: 'var(--alert)',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Revoke
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
