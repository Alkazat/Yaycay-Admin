import { PageHeader, Card, Badge } from '@/components/ui';
import { listProducts, listPurchases } from '@/lib/data';

export default async function CommercePage() {
  const [products, purchases] = await Promise.all([
    listProducts(),
    listPurchases(),
  ]);

  return (
    <>
      <PageHeader
        title="Commerce"
        subtitle="Products, prices and purchases. Read-mostly; Stripe is the source of truth."
      />

      <Card title="Catalogue">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>Price ID</th>
              <th style={{ padding: 'var(--space-2)' }}>Product</th>
              <th style={{ padding: 'var(--space-2)' }}>USD</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.priceId}
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <td style={{ padding: 'var(--space-2)' }}>
                  <code>{p.priceId}</code>
                </td>
                <td style={{ padding: 'var(--space-2)' }}>{p.name}</td>
                <td style={{ padding: 'var(--space-2)' }}>${p.amountUsd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Purchases">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>When</th>
              <th style={{ padding: 'var(--space-2)' }}>Customer</th>
              <th style={{ padding: 'var(--space-2)' }}>Product</th>
              <th style={{ padding: 'var(--space-2)' }}>Tier</th>
              <th style={{ padding: 'var(--space-2)' }}>USD</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td
                  style={{ padding: 'var(--space-2)', color: 'var(--muted)' }}
                >
                  {p.purchasedAt}
                </td>
                <td style={{ padding: 'var(--space-2)' }}>{p.email}</td>
                <td style={{ padding: 'var(--space-2)' }}>{p.productName}</td>
                <td style={{ padding: 'var(--space-2)' }}>
                  {p.tier ? <Badge tone="info">{p.tier}</Badge> : '-'}
                </td>
                <td style={{ padding: 'var(--space-2)' }}>${p.amountUsd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
