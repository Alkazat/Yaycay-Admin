import Link from 'next/link';
import { PageHeader, Card, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { searchTrips } from '@/lib/data';

const inputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { q, cursor } = await searchParams;
  const { items, nextCursor } = await searchTrips({ query: q, cursor });

  const nextHref = nextCursor
    ? `/trips?${new URLSearchParams({ ...(q ? { q } : {}), cursor: nextCursor })}`
    : null;

  return (
    <>
      <PageHeader
        title="Trips"
        subtitle="Search a customer or trip and inspect trip_content, profiles and progress."
      />
      <ApiStatusBanner />
      <Card>
        <form method="get" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="destination, owner email, or trip id"
            style={inputStyle}
          />
          <button
            type="submit"
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
          </button>
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
            </div>
            <Link href={`/trips/${t.id}`}>Inspect trip content</Link>
          </Card>
        ))
      )}

      {nextHref ? <Link href={nextHref}>Next page -&gt;</Link> : null}
    </>
  );
}
