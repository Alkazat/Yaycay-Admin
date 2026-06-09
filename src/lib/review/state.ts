import type { ReviewItem, ReviewStatus } from '@/lib/contracts/types';

/*
 * Pure content-review state transitions, free of Next.js / Supabase so they can
 * be unit-tested. The quality-bar flow is: pending -> approved -> published.
 * Approving content that is already published is a no-op; publishing requires
 * a prior approval.
 */

export type ReviewDecision = 'approve' | 'publish';

const NEXT: Record<ReviewDecision, { from: ReviewStatus; to: ReviewStatus }> = {
  approve: { from: 'pending', to: 'approved' },
  publish: { from: 'approved', to: 'published' },
};

export function canApply(
  status: ReviewStatus,
  decision: ReviewDecision,
): boolean {
  return NEXT[decision].from === status;
}

/** Returns a new list with the decision applied to one item, if valid. */
export function applyDecision(
  items: ReviewItem[],
  tripId: string,
  decision: ReviewDecision,
): ReviewItem[] {
  return items.map((item) => {
    if (item.tripId !== tripId) return item;
    if (!canApply(item.status, decision)) return item;
    return { ...item, status: NEXT[decision].to };
  });
}

export function pendingFirst(items: ReviewItem[]): ReviewItem[] {
  const rank: Record<ReviewStatus, number> = {
    pending: 0,
    approved: 1,
    published: 2,
  };
  return [...items].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] || a.tripId.localeCompare(b.tripId),
  );
}
