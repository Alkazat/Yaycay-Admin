import { PageHeader, Card, Badge } from '@/components/ui';
import { listCustomers } from '@/lib/data';

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
            ) : null}
          </div>
        </Card>
      ))}
    </>
  );
}
