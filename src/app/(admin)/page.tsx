import { PageHeader, Stat, Card } from '@/components/ui';
import { listJobs, listTrips, listPrompts, probeAdminApi } from '@/lib/data';
import { isAdminDataLive } from '@/lib/config';

export default async function DashboardPage() {
  const [jobs, trips, prompts, probe] = await Promise.all([
    listJobs(),
    listTrips(),
    listPrompts(),
    probeAdminApi(),
  ]);
  const failed = jobs.filter((j) => j.status === 'failed').length;
  const activePrompts = prompts.filter((p) => p.active).length;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="For families making memories." />
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-6)',
        }}
      >
        <Stat label="Trips" value={trips.length} />
        <Stat label="AI jobs" value={jobs.length} />
        <Stat label="Failed jobs" value={failed} />
        <Stat label="Active prompts" value={activePrompts} />
      </div>

      {!isAdminDataLive() ? (
        <Card title="Running on stub data">
          <p style={{ margin: 0 }}>
            Sign-in is live, but the BE data API is not configured yet, so
            screens show sample data. Set <code>NEXT_PUBLIC_API_BASE</code> once
            BE publishes the admin endpoints (@alkazat/contracts v0.5) to switch
            to real data.
          </p>
        </Card>
      ) : !probe.ok ? (
        <Card title="Live API not responding">
          <p style={{ margin: 0 }}>
            Connected to the BE API, but it returned an error, so screens may be
            empty.
          </p>
          <p style={{ marginBottom: 0, color: 'var(--alert)' }}>
            <strong>
              {probe.status === 0
                ? 'Could not reach the API'
                : `HTTP ${probe.status}`}
            </strong>{' '}
            on <code>/admin/jobs</code>. {probe.message}
          </p>
          <p
            style={{
              marginBottom: 0,
              color: 'var(--muted)',
              fontSize: '0.85rem',
            }}
          >
            403 usually means the admin JWT is not accepted (role/MFA). 404
            means the endpoint is not deployed. 0 means the API base URL is
            wrong or unreachable.
          </p>
        </Card>
      ) : null}
    </>
  );
}
