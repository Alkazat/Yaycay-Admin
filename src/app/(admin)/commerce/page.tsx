import { PageHeader, Card } from '@/components/ui';
import { listProducts } from '@/lib/data';

export default async function CommercePage() {
  const products = await listProducts();
  return (
    <>
      <PageHeader
        title="Commerce"
        subtitle="Products, prices and purchases. Read-mostly; Stripe is the source of truth."
      />
      <Card>
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
    </>
  );
}
