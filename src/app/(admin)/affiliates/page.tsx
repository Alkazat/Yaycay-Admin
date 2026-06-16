import Link from 'next/link';
import { PageHeader, Card, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { NoticeBanner } from '@/components/NoticeBanner';
import { listAffiliates, listAffiliateRedemptions } from '@/lib/data';
import { summarise } from '@/lib/affiliates/report';
import { createAffiliateAction } from './actions';

const fieldStyle: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

/** Wide window so the list shows lifetime revenue regardless of server clock. */
const ALL_TIME = { start: '0000-01-01', end: '9999-12-31' };

export default async function AffiliatesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; status?: string }>;
}) {
  const { notice, status } = await searchParams;
  const affiliates = await listAffiliates();
  const rows = await Promise.all(
    affiliates.map(async (affiliate) => ({
      affiliate,
      report: summarise(
        affiliate,
        await listAffiliateRedemptions(affiliate.code),
        ALL_TIME,
      ),
    })),
  );

  return (
    <>
      <PageHeader
        title="Affiliates"
        subtitle="Influencer program: discount codes, attributed revenue and the monthly commission report."
      />

      <ApiStatusBanner />
      <NoticeBanner notice={notice} status={status} />

      <Card title="Influencers">
        {rows.length === 0 ? (
          <p style={{ margin: 0 }}>No affiliates yet. Add one below.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: 'var(--space-2)' }}>Influencer</th>
                <th style={{ padding: 'var(--space-2)' }}>Code</th>
                <th style={{ padding: 'var(--space-2)' }}>Discount</th>
                <th style={{ padding: 'var(--space-2)' }}>Commission</th>
                <th style={{ padding: 'var(--space-2)' }}>Status</th>
                <th style={{ padding: 'var(--space-2)' }}>Redemptions</th>
                <th style={{ padding: 'var(--space-2)' }}>Net (lifetime)</th>
                <th style={{ padding: 'var(--space-2)' }}>Owed</th>
                <th style={{ padding: 'var(--space-2)' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ affiliate, report }) => (
                <tr
                  key={affiliate.id}
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <td style={{ padding: 'var(--space-2)' }}>
                    {affiliate.name}
                    <span style={{ color: 'var(--muted)' }}>
                      {' '}
                      {affiliate.handle}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <code>{affiliate.code}</code>
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    {affiliate.discountPercent}%
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    {affiliate.commissionPercent}%
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    {affiliate.status === 'active' ? (
                      <Badge tone="success">active</Badge>
                    ) : (
                      <Badge tone="alert">paused</Badge>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    {report.redemptions}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    ${report.netRevenueUsd.toFixed(2)}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    ${report.commissionOwedUsd.toFixed(2)}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <Link href={`/affiliates/${affiliate.code}`}>
                      Open report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="New affiliate">
        <p style={{ marginTop: 0, color: 'var(--muted)' }}>
          The discount code and landing slug are derived from the handle and
          discount (e.g. &quot;@sunnytravels&quot; at 15% becomes{' '}
          <code>SUNNYTRA15</code> and <code>/go/sunnytravels</code>). BE
          registers the code with Stripe as a coupon.
        </p>
        <form
          action={createAffiliateAction}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-3)',
            alignItems: 'end',
          }}
        >
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Name
            </span>
            <input
              name="name"
              required
              placeholder="Sunny Travels"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Report email
            </span>
            <input
              name="email"
              type="email"
              required
              placeholder="sunny@example.com"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Handle
            </span>
            <input
              name="handle"
              required
              placeholder="@sunnytravels"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Discount %
            </span>
            <input
              name="discountPercent"
              type="number"
              min="0"
              max="100"
              required
              placeholder="15"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Commission %
            </span>
            <input
              name="commissionPercent"
              type="number"
              min="0"
              max="100"
              required
              placeholder="20"
              style={fieldStyle}
            />
          </label>
          <button
            type="submit"
            style={{ ...fieldStyle, cursor: 'pointer', fontWeight: 700 }}
          >
            Add affiliate
          </button>
        </form>
      </Card>
    </>
  );
}
