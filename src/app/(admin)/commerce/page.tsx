import { PageHeader, Card, Badge } from '@/components/ui';
import { listProducts, listPurchases } from '@/lib/data';
import { createProductAction } from './actions';

const fieldStyle: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

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
              <th style={{ padding: 'var(--space-2)' }}>Kind</th>
              <th style={{ padding: 'var(--space-2)' }}>Tier</th>
              <th style={{ padding: 'var(--space-2)' }}>Status</th>
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
                <td style={{ padding: 'var(--space-2)' }}>
                  <Badge tone="info">{p.kind}</Badge>
                  {p.kind === 'keep' && p.extendsMonths != null ? (
                    <span style={{ color: 'var(--muted)' }}>
                      {' '}
                      +{p.extendsMonths}mo
                    </span>
                  ) : null}
                </td>
                <td style={{ padding: 'var(--space-2)' }}>
                  {p.tier ? <Badge tone="info">{p.tier}</Badge> : '-'}
                </td>
                <td style={{ padding: 'var(--space-2)' }}>
                  {p.active ? (
                    <Badge tone="success">active</Badge>
                  ) : (
                    <Badge tone="alert">inactive</Badge>
                  )}
                </td>
                <td style={{ padding: 'var(--space-2)' }}>${p.amountUsd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="New product">
        <p style={{ marginTop: 0, color: 'var(--muted)' }}>
          Adds a catalogue entry against an existing Stripe price. BE stamps the
          deployment&apos;s Stripe mode, so a production admin can only add live
          products.
        </p>
        <form
          action={createProductAction}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-3)',
            alignItems: 'end',
          }}
        >
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Stripe price ID
            </span>
            <input
              name="priceId"
              required
              placeholder="price_..."
              style={fieldStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Name
            </span>
            <input
              name="name"
              required
              placeholder="Product name"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Price (USD)
            </span>
            <input
              name="amountUsd"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="49.00"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Kind
            </span>
            <select name="kind" defaultValue="tier" style={fieldStyle}>
              <option value="tier">tier</option>
              <option value="keep">keep</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Tier (kind=tier)
            </span>
            <select name="tier" defaultValue="" style={fieldStyle}>
              <option value="">-</option>
              <option value="ours">ours</option>
              <option value="byo">byo</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Extends (months, kind=keep)
            </span>
            <input
              name="extendsMonths"
              type="number"
              min="1"
              placeholder="12"
              style={fieldStyle}
            />
          </label>
          <button
            type="submit"
            style={{ ...fieldStyle, cursor: 'pointer', fontWeight: 700 }}
          >
            Add product
          </button>
        </form>
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
