import Link from 'next/link';
import { PageHeader, Card, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { SubmitButton } from '@/components/SubmitButton';
import { searchCustomers } from '@/lib/data';
import { deletionRequestAction } from './actions';
import { startSupportSessionAction } from '../support/actions';

const inputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { q, cursor } = await searchParams;
  const { items, nextCursor } = await searchCustomers({ query: q, cursor });

  const nextHref = nextCursor
    ? `/customers?${new URLSearchParams({ ...(q ? { q } : {}), cursor: nextCursor })}`
    : null;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Account lookup, entitlement, retention status and data-deletion requests."
      />
      <ApiStatusBanner />
      <Card>
        <form method="get" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="email"
            style={inputStyle}
          />
          <SubmitButton
            pendingLabel="Searching..."
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
          </SubmitButton>
        </form>
      </Card>

      {items.length === 0 ? (
        <Card>
          <p style={{ margin: 0 }}>No customers match.</p>
        </Card>
      ) : (
        items.map((c) => (
          <Card key={c.userId} title={c.email}>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {c.tier ? (
                <Badge tone="info">{c.tier}</Badge>
              ) : (
                <Badge>no tier</Badge>
              )}
              <span style={{ color: 'var(--muted)' }}>
                retention: {c.retentionExpiresAt ?? 'disposal by default'}
              </span>
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <form
                  action={startSupportSessionAction}
                  style={{ display: 'flex', gap: 'var(--space-2)' }}
                >
                  <input type="hidden" name="targetUserId" value={c.userId} />
                  <input
                    name="reason"
                    placeholder="reason / ticket #"
                    required
                    style={{
                      minHeight: 'var(--tap-min)',
                      padding: '0 var(--space-3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                    }}
                  />
                  <SubmitButton
                    pendingLabel="Starting..."
                    style={{
                      minHeight: 'var(--tap-min)',
                      padding: '0 var(--space-4)',
                      border: '1px solid var(--brand-primary)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      color: 'var(--brand-primary-deep)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Start support session
                  </SubmitButton>
                </form>
                {c.deletionRequested ? (
                  <Badge tone="alert">deletion requested</Badge>
                ) : (
                  <form action={deletionRequestAction}>
                    <input type="hidden" name="userId" value={c.userId} />
                    <SubmitButton
                      pendingLabel="Recording..."
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
                      Request deletion
                    </SubmitButton>
                  </form>
                )}
              </div>
            </div>
          </Card>
        ))
      )}

      {nextHref ? <Link href={nextHref}>Next page -&gt;</Link> : null}
    </>
  );
}
