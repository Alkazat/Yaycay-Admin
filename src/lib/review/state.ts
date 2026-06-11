import type { ReviewItem, ReviewStatus } from '@/lib/contracts/types';

/*
 * Pure content-review state transitions, free of Next.js / Supabase so they can
 * be unit-tested. Per the contract, from `pending` an admin either approves the
 * content as is (-> `approved`) or edits then publishes it (-> `edited`). Both
 * are terminal; a reviewed item cannot be re-decided.
 */

export type ReviewDecision = 'approve' | 'edit';

const NEXT: Record<ReviewDecision, ReviewStatus> = {
  approve: 'approved',
  edit: 'edited',
};

/** A decision can only be applied to a pending item. */
export function canApply(status: ReviewStatus): boolean {
  return status === 'pending';
}

/** Returns a new list with the decision applied to one pending item, if valid. */
export function applyDecision(
  items: ReviewItem[],
  tripId: string,
  decision: ReviewDecision,
): ReviewItem[] {
  return items.map((item) => {
    if (item.tripId !== tripId || !canApply(item.status)) return item;
    return { ...item, status: NEXT[decision] };
  });
}

export function pendingFirst(items: ReviewItem[]): ReviewItem[] {
  const rank: Record<ReviewStatus, number> = {
    pending: 0,
    approved: 1,
    edited: 2,
  };
  return [...items].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] || a.tripId.localeCompare(b.tripId),
  );
}
