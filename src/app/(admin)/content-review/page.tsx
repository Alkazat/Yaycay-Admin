import { PageHeader, Card, Badge } from '@/components/ui';
import { listReviewItems } from '@/lib/data';
import type { ReviewStatus } from '@/lib/contracts/types';
import { approveAction, publishAction } from './actions';

const tone: Record<ReviewStatus, 'default' | 'success' | 'alert' | 'info'> = {
  pending: 'alert',
  approved: 'info',
  published: 'success',
};

const buttonStyle = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-6)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--brand-cta)',
  color: 'var(--ink)',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  cursor: 'pointer',
} as const;

export default async function ContentReviewPage() {
  const items = await listReviewItems();

  return (
    <>
      <PageHeader
        title="Content review"
        subtitle="Approve, then publish AI-generated content before it reaches a family. Quality bar: pending to approved to published."
      />
      {items.length === 0 ? (
        <Card>
          <p style={{ margin: 0 }}>Nothing awaiting review.</p>
        </Card>
      ) : (
        items.map((item) => (
          <Card
            key={item.tripId}
            title={`${item.destination} (${item.tripId})`}
          >
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-3)',
              }}
            >
              <Badge tone={tone[item.status]}>{item.status}</Badge>
              <Badge>prompt v{item.promptVersion}</Badge>
              <span style={{ color: 'var(--muted)' }}>
                generated {item.generatedAt}
              </span>
            </div>
            <p style={{ marginTop: 0 }}>{item.summary}</p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {item.status === 'pending' ? (
                <form action={approveAction}>
                  <input type="hidden" name="tripId" value={item.tripId} />
                  <button type="submit" style={buttonStyle}>
                    Approve
                  </button>
                </form>
              ) : null}
              {item.status === 'approved' ? (
                <form action={publishAction}>
                  <input type="hidden" name="tripId" value={item.tripId} />
                  <button type="submit" style={buttonStyle}>
                    Publish
                  </button>
                </form>
              ) : null}
              {item.status === 'published' ? (
                <span style={{ color: 'var(--success)' }}>
                  Published to the family.
                </span>
              ) : null}
            </div>
          </Card>
        ))
      )}
    </>
  );
}
