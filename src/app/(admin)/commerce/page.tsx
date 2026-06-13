import { PageHeader, Card, Badge } from '@/components/ui';
import { listProducts, listPurchases } from '@/lib/data';

/** Live/Test badge for a Stripe `livemode` flag. Renders nothing when unknown. */
function ModeBadge({ livemode }: { livemode?: boolean }) {
  if (livemode === undefined) return null;
  return livemode ? (
    <Badge tone="success">live</Badge>
  ) : (
    <Badge tone="alert">test</Badge>
  );
}

export default async function CommercePage() {
  const [products, purchases] = await Promise.all([
    listProducts(),
    listPurchases(),
  ]);

  // Flag a dangerous mix: test and live catalogue items showing together.
  const modesKnown = products.some((p) => p.livemode !== undefined);
  const hasTest = products.some((p) => p.livemode === false);
  const hasLive = products.some((p) => p.livemode === true);
  const mixedModes = hasTest && hasLive;

  return (
    <>
      <PageHeader
        title="Commerce"
        subtitle="Products, prices and purchases. Read-mostly; Stripe is the source of truth."
      />

      {mixedModes ? (
        <Card title="Mixed Stripe modes">
          <p style={{ margin: 0, color: 'var(--alert)' }}>
            <strong>Warning:</strong> this catalogue includes both live and test
            (sandbox) products. A production admin should only show live. This
            is a BE scoping issue - <code>/admin/products</code> should return
            only the deployment&apos;s Stripe mode.
          </p>
        </Card>
      ) : null}

      <Card title="Catalogue">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>Price ID</th>
              <th style={{ padding: 'var(--space-2)' }}>Product</th>
              {modesKnown ? (
                <th style={{ padding: 'var(--space-2)' }}>Mode</th>
              ) : null}
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
                {modesKnown ? (
                  <td style={{ padding: 'var(--space-2)' }}>
                    <ModeBadge livemode={p.livemode} />
                  </td>
                ) : null}
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
              <th style={{ padding: 'var(--space-2)' }}>Price</th>
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
                  {p.createdAt}
                </td>
                <td style={{ padding: 'var(--space-2)' }}>{p.ownerEmail}</td>
                <td style={{ padding: 'var(--space-2)' }}>
                  <code>{p.priceId}</code>
                </td>
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
