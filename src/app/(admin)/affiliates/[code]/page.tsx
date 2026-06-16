import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card, Badge } from '@/components/ui';
import { NoticeBanner } from '@/components/NoticeBanner';
import { getAffiliate, listAffiliateRedemptions } from '@/lib/data';
import {
  monthPeriodFromKey,
  renderReportEmail,
  summarise,
} from '@/lib/affiliates/report';
import {
  setStatusAction,
  sendReportAction,
  updateAffiliateAction,
  archiveAffiliateAction,
} from '../actions';

const buttonStyle: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-4)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--brand-cta)',
  color: 'var(--ink)',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  cursor: 'pointer',
};

const fieldStyle: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

export default async function AffiliateReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    month?: string;
    notice?: string;
    status?: string;
    detail?: string;
  }>;
}) {
  const { code } = await params;
  const { month, notice, status, detail } = await searchParams;
  const affiliate = await getAffiliate(code);
  if (!affiliate) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const monthKey = month ?? today.slice(0, 7);
  const period = monthPeriodFromKey(monthKey, today);

  const redemptions = await listAffiliateRedemptions(code);
  const report = summarise(affiliate, redemptions, period);
  const inPeriod = redemptions.filter(
    (r) =>
      r.createdAt.slice(0, 10) >= period.start &&
      r.createdAt.slice(0, 10) < period.end,
  );
  const emailBody = renderReportEmail(report, affiliate);

  return (
    <>
      <PageHeader
        title={affiliate.name}
        subtitle={`${affiliate.handle} · code ${affiliate.code}`}
      />
      <p style={{ marginTop: 'calc(-1 * var(--space-4))' }}>
        <Link href="/affiliates">&lt;- All affiliates</Link>
      </p>

      <NoticeBanner notice={notice} status={status} detail={detail} />

      <Card title="Program">
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-3)',
          }}
        >
          {affiliate.status === 'active' ? (
            <Badge tone="success">active</Badge>
          ) : (
            <Badge tone="alert">paused</Badge>
          )}
          <Badge tone="info">{affiliate.discountPercent}% discount</Badge>
          <Badge tone="info">{affiliate.commissionPercent}% commission</Badge>
          <span style={{ color: 'var(--muted)' }}>
            landing: <code>yaycay.ai/go/{affiliate.landingSlug}</code>
          </span>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: 'var(--space-2)',
            }}
          >
            <form action={setStatusAction}>
              <input type="hidden" name="code" value={affiliate.code} />
              <input
                type="hidden"
                name="status"
                value={affiliate.status === 'active' ? 'paused' : 'active'}
              />
              <button
                type="submit"
                style={{
                  ...buttonStyle,
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border)',
                }}
              >
                {affiliate.status === 'active' ? 'Pause' : 'Reactivate'}
              </button>
            </form>
            <form action={archiveAffiliateAction}>
              <input type="hidden" name="code" value={affiliate.code} />
              <button
                type="submit"
                style={{
                  ...buttonStyle,
                  background: 'var(--surface)',
                  color: 'var(--alert)',
                  border: '1px solid var(--alert)',
                }}
              >
                Archive
              </button>
            </form>
          </div>
        </div>
      </Card>

      <Card title="Edit affiliate">
        <p style={{ marginTop: 0, color: 'var(--muted)' }}>
          Changing the discount or code recreates the Stripe coupon on the
          backend (coupons are immutable). Commission and contact details edit
          freely.
        </p>
        <form
          action={updateAffiliateAction}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-3)',
            alignItems: 'end',
          }}
        >
          <input type="hidden" name="currentCode" value={affiliate.code} />
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Name
            </span>
            <input
              name="name"
              required
              defaultValue={affiliate.name}
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
              defaultValue={affiliate.email}
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
              defaultValue={affiliate.handle}
              style={fieldStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Code (recreates coupon)
            </span>
            <input
              name="code"
              required
              defaultValue={affiliate.code}
              style={fieldStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Discount % (recreates coupon)
            </span>
            <input
              name="discountPercent"
              type="number"
              min="0"
              max="100"
              required
              defaultValue={affiliate.discountPercent}
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
              defaultValue={affiliate.commissionPercent}
              style={fieldStyle}
            />
          </label>
          <button
            type="submit"
            style={{ ...fieldStyle, cursor: 'pointer', fontWeight: 700 }}
          >
            Save changes
          </button>
        </form>
      </Card>

      <Card title="Monthly report">
        <form
          method="get"
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            alignItems: 'end',
            marginBottom: 'var(--space-4)',
          }}
        >
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Month
            </span>
            <input
              name="month"
              type="month"
              defaultValue={monthKey}
              style={{
                minHeight: 'var(--tap-min)',
                padding: '0 var(--space-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              ...buttonStyle,
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
            }}
          >
            View
          </button>
        </form>

        <p style={{ marginTop: 0, color: 'var(--muted)' }}>
          {report.periodStart} to {report.periodEnd}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Stat label="Redemptions" value={report.redemptions} />
          <Stat label="Gross" value={`$${report.grossRevenueUsd.toFixed(2)}`} />
          <Stat
            label="Discount given"
            value={`$${report.discountGivenUsd.toFixed(2)}`}
          />
          <Stat label="Net" value={`$${report.netRevenueUsd.toFixed(2)}`} />
          <Stat
            label="Commission owed"
            value={`$${report.commissionOwedUsd.toFixed(2)}`}
          />
        </div>

        <form action={sendReportAction}>
          <input type="hidden" name="code" value={affiliate.code} />
          <input type="hidden" name="month" value={monthKey} />
          <button type="submit" style={buttonStyle}>
            Email report to {affiliate.email}
          </button>
        </form>
      </Card>

      <Card title="Report email preview">
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-body)',
            color: 'var(--ink)',
          }}
        >
          {emailBody}
        </pre>
      </Card>

      <Card title="Redemptions this period">
        {inPeriod.length === 0 ? (
          <p style={{ margin: 0 }}>No redemptions in this month.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: 'var(--space-2)' }}>When</th>
                <th style={{ padding: 'var(--space-2)' }}>Customer</th>
                <th style={{ padding: 'var(--space-2)' }}>Price</th>
                <th style={{ padding: 'var(--space-2)' }}>Gross</th>
                <th style={{ padding: 'var(--space-2)' }}>Discount</th>
                <th style={{ padding: 'var(--space-2)' }}>Net</th>
              </tr>
            </thead>
            <tbody>
              {inPeriod.map((r) => (
                <tr
                  key={r.purchaseId}
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <td
                    style={{ padding: 'var(--space-2)', color: 'var(--muted)' }}
                  >
                    {r.createdAt.slice(0, 10)}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>{r.ownerEmail}</td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <code>{r.priceId}</code>
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    ${r.grossUsd.toFixed(2)}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    ${r.discountUsd.toFixed(2)}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    ${r.netUsd.toFixed(2)}
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

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-3) var(--space-4)',
        minWidth: 120,
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{label}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          color: 'var(--brand-primary-deep)',
        }}
      >
        {value}
      </div>
    </div>
  );
}
