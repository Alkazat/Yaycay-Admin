import { PageHeader, Card, Badge } from '@/components/ui';
import { listJobs } from '@/lib/data';

/*
 * Content review: approve/edit AI-generated content before publish.
 * Scaffold lists recently generated content awaiting review (derived here from
 * succeeded generation jobs); the approve/edit/publish flow lands next.
 */
export default async function ContentReviewPage() {
  const jobs = await listJobs();
  const awaiting = jobs.filter(
    (j) => j.kind === 'generation' && j.status === 'succeeded',
  );
  return (
    <>
      <PageHeader
        title="Content review"
        subtitle="Approve or edit AI-generated content before it reaches a family."
      />
      {awaiting.length === 0 ? (
        <Card>
          <p style={{ margin: 0 }}>Nothing awaiting review.</p>
        </Card>
      ) : (
        awaiting.map((j) => (
          <Card key={j.id} title={`Trip ${j.tripId}`}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Badge tone="info">generation</Badge>
              <Badge>prompt v{j.promptVersion}</Badge>
              <Badge tone="success">ready to review</Badge>
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
              Generated {j.createdAt}. Review and publish flow coming next.
            </p>
          </Card>
        ))
      )}
    </>
  );
}
