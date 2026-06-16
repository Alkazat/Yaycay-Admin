import { PageHeader, Card, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { SubmitButton } from '@/components/SubmitButton';
import { listJobs } from '@/lib/data';
import { usageByTripDay, DAILY_CAP } from '@/lib/jobs/cap';
import type { AiJobStatus } from '@/lib/contracts/types';
import { retryAction } from './actions';

const tone: Record<AiJobStatus, 'default' | 'success' | 'alert' | 'info'> = {
  queued: 'default',
  running: 'info',
  succeeded: 'success',
  failed: 'alert',
};

export default async function JobsPage() {
  const jobs = await listJobs();
  const usage = usageByTripDay(jobs);

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle="ai_jobs stream: generation, ingestion, chat. Triage failures, retry, and watch the daily cap."
      />

      <ApiStatusBanner />

      <Card title={`Daily cap usage (cap ${DAILY_CAP} per trip per day)`}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>Trip</th>
              <th style={{ padding: 'var(--space-2)' }}>Date</th>
              <th style={{ padding: 'var(--space-2)' }}>Used</th>
              <th style={{ padding: 'var(--space-2)' }}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((u) => (
              <tr
                key={`${u.tripId}-${u.date}`}
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <td style={{ padding: 'var(--space-2)' }}>{u.tripId}</td>
                <td style={{ padding: 'var(--space-2)' }}>{u.date}</td>
                <td style={{ padding: 'var(--space-2)' }}>
                  {u.count} / {DAILY_CAP}
                </td>
                <td style={{ padding: 'var(--space-2)' }}>
                  {u.atCap ? (
                    <Badge tone="alert">at cap</Badge>
                  ) : (
                    <Badge tone="success">{u.remaining} left</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {jobs.map((j) => (
        <Card key={j.id}>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Badge tone={tone[j.status]}>{j.status}</Badge>
            <Badge tone="info">{j.kind}</Badge>
            <Badge>{j.model}</Badge>
            <span style={{ color: 'var(--muted)' }}>
              trip {j.tripId} · prompt v{j.promptVersion} · {j.createdAt}
            </span>
            {j.status === 'failed' ? (
              <form action={retryAction} style={{ marginLeft: 'auto' }}>
                <input type="hidden" name="id" value={j.id} />
                <SubmitButton
                  pendingLabel="Retrying..."
                  style={{
                    minHeight: 'var(--tap-min)',
                    padding: '0 var(--space-4)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--brand-cta)',
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </SubmitButton>
              </form>
            ) : null}
          </div>
          {j.error ? (
            <p style={{ color: 'var(--alert)', marginBottom: 0 }}>{j.error}</p>
          ) : null}
        </Card>
      ))}
    </>
  );
}
