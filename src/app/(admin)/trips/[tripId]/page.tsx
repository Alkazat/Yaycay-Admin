import { notFound } from 'next/navigation';
import { PageHeader, Card, Badge } from '@/components/ui';
import { getTripContent } from '@/lib/data';

export default async function TripInspectPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const content = await getTripContent(tripId);
  if (!content) notFound();

  return (
    <>
      <PageHeader
        title={content.trip.destination}
        subtitle={`Trip ${content.trip.id} · read-only inspector`}
      />
      {content.days.map((day) => (
        <Card key={day.id} title={`${day.date} - ${day.label}`}>
          {day.summary ? (
            <p style={{ color: 'var(--muted)' }}>{day.summary}</p>
          ) : null}
          {day.moments.map((moment) => (
            <div key={moment.id} style={{ marginBottom: 'var(--space-3)' }}>
              <strong>
                {moment.slot} - {moment.title}
              </strong>
              <ul>
                {moment.activities.map((a) => (
                  <li key={a.id}>
                    <Badge tone="info">{a.kind}</Badge> {a.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      ))}
    </>
  );
}
