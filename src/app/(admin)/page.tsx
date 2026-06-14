import { PageHeader, Stat } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { listJobs, listTrips, listPrompts, probeAdminApi } from '@/lib/data';

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

      <ApiStatusBanner probe={probe} />
    </>
  );
}
