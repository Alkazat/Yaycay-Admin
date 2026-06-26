import Link from 'next/link';
import { PageHeader, Card, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { NoticeBanner } from '@/components/NoticeBanner';
import { SubmitButton } from '@/components/SubmitButton';
import { searchTrips } from '@/lib/data';
import { createTripAction, deleteTripAction } from './actions';

const inputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

const fieldStyle: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    cursor?: string;
    notice?: string;
    status?: string;
    detail?: string;
  }>;
}) {
  const { q, cursor, notice, status, detail } = await searchParams;
  const { items, nextCursor } = await searchTrips({ query: q, cursor });

  const nextHref = nextCursor
    ? `/trips?${new URLSearchParams({ ...(q ? { q } : {}), cursor: nextCursor })}`
    : null;

  return (
    <>
      <PageHeader
        title="Trips"
        subtitle="Search a customer or trip and inspect trip_content, profiles and progress. Create or delete trips directly - no paywall."
      />
      <ApiStatusBanner />
      <NoticeBanner notice={notice} status={status} detail={detail} />

      <Card title="Create a trip">
        <p style={{ marginTop: 0, color: 'var(--muted)' }}>
          Provision a trip for a user with no purchase. BE assigns the trip and
          its tier entitlement directly, skipping Stripe.
        </p>
        <form
          action={createTripAction}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-3)',
            alignItems: 'end',
          }}
        >
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Owner email
            </span>
            <input name="ownerEmail" type="email" required style={fieldStyle} />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Destination
            </span>
            <input name="destination" required style={fieldStyle} />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Tier
            </span>
            <select name="tier" defaultValue="ours" style={fieldStyle}>
              <option value="ours">ours</option>
              <option value="byo">byo</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Start date
            </span>
            <input name="startDate" type="date" required style={fieldStyle} />
          </label>
          <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              End date
            </span>
            <input name="endDate" type="date" required style={fieldStyle} />
          </label>
          <SubmitButton
            pendingLabel="Creating..."
            style={{
              ...fieldStyle,
              cursor: 'pointer',
              fontWeight: 700,
              border: '1px solid var(--brand-primary)',
              color: 'var(--brand-primary-deep)',
            }}
          >
            Create trip
          </SubmitButton>
        </form>
      </Card>

      <Card>
        <form method="get" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="destination, owner email, or trip id"
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
          <p style={{ margin: 0 }}>No trips match.</p>
        </Card>
      ) : (
        items.map((t) => (
          <Card key={t.id} title={t.destination}>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
                marginBottom: 'var(--space-2)',
                flexWrap: 'wrap',
              }}
            >
              <Badge tone="info">{t.tier}</Badge>
              <Badge>{t.status}</Badge>
              <span style={{ color: 'var(--muted)' }}>
                {t.startDate} to {t.endDate} · {t.ownerEmail}
              </span>
              <form
                action={deleteTripAction}
                style={{ marginLeft: 'auto' }}
              >
                <input type="hidden" name="tripId" value={t.id} />
                <SubmitButton
                  pendingLabel="Deleting..."
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
                  Delete trip
                </SubmitButton>
              </form>
            </div>
            <Link href={`/trips/${t.id}`}>Inspect trip content</Link>
          </Card>
        ))
      )}

      {nextHref ? <Link href={nextHref}>Next page -&gt;</Link> : null}
    </>
  );
}
