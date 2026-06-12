import Link from 'next/link';
import { PageHeader, Card, Badge } from '@/components/ui';
import { listReviewItems } from '@/lib/data';
import type { ReviewStatus } from '@/lib/contracts/types';
import { approveAction } from './actions';

const tone: Record<ReviewStatus, 'default' | 'success' | 'alert' | 'info'> = {
  pending: 'alert',
  approved: 'success',
  edited: 'info',
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
        subtitle="The quality bar for AI-generated content before it reaches a family. Approve as is, or edit then publish."
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
              <span style={{ color: 'var(--muted)' }}>
                generated {item.generatedAt}
                {item.reviewedAt
                  ? ` · reviewed ${item.reviewedAt} by ${item.reviewedBy ?? 'unknown'}`
                  : ''}
              </span>
            </div>
            {item.status === 'pending' ? (
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <form action={approveAction}>
                  <input type="hidden" name="tripId" value={item.tripId} />
                  <button type="submit" style={buttonStyle}>
                    Approve
                  </button>
                </form>
                <Link
                  href={`/content-review/${item.tripId}/edit`}
                  style={{
                    ...buttonStyle,
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    border: '1px solid var(--border)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                  }}
                >
                  Edit and publish
                </Link>
              </div>
            ) : (
              <span style={{ color: 'var(--success)' }}>
                Reviewed - {item.status}.
              </span>
            )}
          </Card>
        ))
      )}
    </>
  );
}
