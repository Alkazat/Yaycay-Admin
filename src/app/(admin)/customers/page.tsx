import { PageHeader, Card, Badge } from '@/components/ui';
import { listCustomers } from '@/lib/data';
import { deletionRequestAction } from './actions';

export default async function CustomersPage() {
  const customers = await listCustomers();
  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Account lookup, entitlement, retention status and data-deletion requests."
      />
      {customers.map((c) => (
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
            {c.deletionRequested ? (
              <Badge tone="alert">deletion requested</Badge>
            ) : (
              <form
                action={deletionRequestAction}
                style={{ marginLeft: 'auto' }}
              >
                <input type="hidden" name="userId" value={c.userId} />
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
                  Request deletion
                </button>
              </form>
            )}
          </div>
        </Card>
      ))}
    </>
  );
}
