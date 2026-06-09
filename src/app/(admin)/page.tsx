import { PageHeader, Stat, Card } from '@/components/ui';
import { listJobs, listTrips, listPrompts } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/config';

export default async function DashboardPage() {
  const [jobs, trips, prompts] = await Promise.all([
    listJobs(),
    listTrips(),
    listPrompts(),
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
      {!isSupabaseConfigured() ? (
        <Card title="Running on stub data">
          <p style={{ margin: 0 }}>
            Supabase / BE are not configured, so screens are showing local
            fixtures. Set the env values in <code>.env.local</code> to connect
            the admin Supabase client and the BE admin endpoints.
          </p>
        </Card>
      ) : null}
    </>
  );
}
