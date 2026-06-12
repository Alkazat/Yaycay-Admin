import { notFound } from 'next/navigation';
import { PageHeader, Card, Badge } from '@/components/ui';
import { getTripContent, listTripProfiles, listTripProgress } from '@/lib/data';
import { presentVariantModes, profileSafety } from '@/lib/trips/inspector';

export default async function TripInspectPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const [content, profiles, progress] = await Promise.all([
    getTripContent(tripId),
    listTripProfiles(tripId),
    listTripProgress(tripId),
  ]);
  if (!content) notFound();

  const doneByProfile = new Map(progress.map((p) => [p.profileId, p]));

  return (
    <>
      <PageHeader
        title={content.trip.destination}
        subtitle={`Trip ${content.trip.id} · read-only inspector`}
      />

      {profiles.length > 0 ? (
        <Card title="Profiles">
          {profiles.map((profile) => {
            const safety = profileSafety(profile);
            const prog = doneByProfile.get(profile.id);
            return (
              <div
                key={profile.id}
                style={{
                  borderTop: '1px solid var(--border)',
                  padding: 'var(--space-3) 0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <strong>{profile.name}</strong>
                  {profile.age != null ? (
                    <Badge>age {profile.age}</Badge>
                  ) : null}
                  {profile.mode ? (
                    <Badge tone="info">{profile.mode}</Badge>
                  ) : null}
                  {prog ? (
                    <span style={{ color: 'var(--muted)' }}>
                      {prog.doneItems.length} done
                    </span>
                  ) : null}
                </div>
                {profile.interests.length > 0 ? (
                  <p
                    style={{
                      margin: 'var(--space-1) 0',
                      color: 'var(--muted)',
                    }}
                  >
                    interests: {profile.interests.join(', ')}
                  </p>
                ) : null}
                {safety.hasAny ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-2)',
                      flexWrap: 'wrap',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    {[...safety.medical, ...safety.dietary].map((flag) => (
                      <Badge key={flag} tone="alert">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </Card>
      ) : null}

      {content.days.map((day) => (
        <Card key={day.id} title={`${day.date} - ${day.label}`}>
          {day.summary ? (
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>{day.summary}</p>
          ) : null}

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-3)',
            }}
          >
            {day.weather ? (
              <Badge tone="info">
                {day.weather.summary}
                {day.weather.high_c != null
                  ? ` · ${day.weather.low_c ?? '?'}-${day.weather.high_c}C`
                  : ''}
              </Badge>
            ) : null}
            {day.hotel ? (
              <Badge tone={day.hotel.move ? 'alert' : 'default'}>
                {day.hotel.move ? 'move to ' : 'stay: '}
                {day.hotel.name}
              </Badge>
            ) : null}
            {day.game ? (
              <Badge tone="success">game: {day.game.title}</Badge>
            ) : null}
            {day.star_challenge ? (
              <Badge tone="success">
                ★{day.star_challenge.stars} {day.star_challenge.title}
              </Badge>
            ) : null}
          </div>

          {day.did_you_know ? (
            <p style={{ marginTop: 0 }}>
              <strong>Did you know?</strong> {day.did_you_know}
            </p>
          ) : null}

          {day.moments.map((moment) => (
            <div key={moment.id} style={{ marginBottom: 'var(--space-4)' }}>
              <strong>
                {moment.slot} - {moment.title}
              </strong>
              {moment.location ? (
                <span style={{ color: 'var(--muted)' }}>
                  {' '}
                  @ {moment.location.name}
                </span>
              ) : null}
              <ul style={{ marginTop: 'var(--space-2)' }}>
                {moment.activities.map((a) => {
                  const modes = presentVariantModes(a.variants);
                  return (
                    <li key={a.id} style={{ marginBottom: 'var(--space-3)' }}>
                      <Badge tone="info">{a.kind}</Badge>{' '}
                      <strong>{a.title}</strong>
                      {a.body ? (
                        <p style={{ margin: 'var(--space-1) 0' }}>{a.body}</p>
                      ) : null}
                      {a.facts && a.facts.length > 0 ? (
                        <p
                          style={{
                            margin: 'var(--space-1) 0',
                            color: 'var(--muted)',
                          }}
                        >
                          facts: {a.facts.join(' · ')}
                        </p>
                      ) : null}
                      {a.challenge ? (
                        <p style={{ margin: 'var(--space-1) 0' }}>
                          <Badge>{a.challenge.type}</Badge> {a.challenge.prompt}
                          {a.challenge.answer ? (
                            <span style={{ color: 'var(--muted)' }}>
                              {' '}
                              (answer: {a.challenge.answer})
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      {modes.length > 0 ? (
                        <div
                          style={{
                            display: 'flex',
                            gap: 'var(--space-1)',
                            flexWrap: 'wrap',
                          }}
                        >
                          {modes.map((m) => (
                            <Badge key={m}>{m}</Badge>
                          ))}
                        </div>
                      ) : null}
                      {a.booking ? (
                        <p
                          style={{
                            margin: 'var(--space-1) 0',
                            color: 'var(--muted)',
                          }}
                        >
                          booking: {a.booking.name}
                          {a.booking.time ? ` @ ${a.booking.time}` : ''}
                        </p>
                      ) : null}
                      {a.safety?.note ? (
                        <p
                          style={{
                            margin: 'var(--space-1) 0',
                            color: 'var(--alert)',
                          }}
                        >
                          safety: {a.safety.note}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Card>
      ))}
    </>
  );
}
