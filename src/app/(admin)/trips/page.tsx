import Link from 'next/link';
import { PageHeader, Card, Badge } from '@/components/ui';
import { listTrips } from '@/lib/data';

export default async function TripsPage() {
  const trips = await listTrips();
  return (
    <>
      <PageHeader
        title="Trips"
        subtitle="Search a customer or trip and inspect trip_content, profiles and progress."
      />
      {trips.map((t) => (
        <Card key={t.id} title={t.destination}>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
              marginBottom: 'var(--space-2)',
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
      ))}
    </>
  );
}
