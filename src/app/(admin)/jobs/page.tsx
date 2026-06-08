import { PageHeader, Card, Badge } from '@/components/ui';
import { listJobs } from '@/lib/data';
import type { AiJobStatus } from '@/lib/contracts/types';

const tone: Record<AiJobStatus, 'default' | 'success' | 'alert' | 'info'> = {
  queued: 'default',
  running: 'info',
  succeeded: 'success',
  failed: 'alert',
};

export default async function JobsPage() {
  const jobs = await listJobs();
  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle="ai_jobs stream: generation, ingestion, chat. Triage failures and watch the daily cap."
      />
      {jobs.map((j) => (
        <Card key={j.id}>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
            }}
          >
            <Badge tone={tone[j.status]}>{j.status}</Badge>
            <Badge tone="info">{j.kind}</Badge>
            <Badge>{j.model}</Badge>
            <span style={{ color: 'var(--muted)' }}>
              trip {j.tripId} · prompt v{j.promptVersion} · {j.createdAt}
            </span>
          </div>
          {j.error ? (
            <p style={{ color: 'var(--alert)', marginBottom: 0 }}>{j.error}</p>
          ) : null}
        </Card>
      ))}
    </>
  );
}
