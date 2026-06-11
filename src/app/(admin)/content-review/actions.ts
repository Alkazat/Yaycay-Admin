'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { decideReview } from '@/lib/data';
import { recordAudit } from '@/lib/audit';
import type { ReviewDecision } from '@/lib/review/state';

/*
 * Apply a review decision to generated content: approve as is, or edit then
 * publish. Each re-checks admin + MFA and is audited.
 */
async function decide(formData: FormData, decision: ReviewDecision) {
  const session = await requireAdmin();
  const tripId = String(formData.get('tripId') ?? '');
  if (!tripId) return;

  const updated = await decideReview(tripId, decision);
  if (updated) {
    await recordAudit({
      actor: session.email,
      action: `content.${decision}`,
      target: tripId,
      details: `now ${updated.status}`,
    });
    revalidatePath('/content-review');
  }
}

export async function approveAction(formData: FormData): Promise<void> {
  await decide(formData, 'approve');
}

export async function editAction(formData: FormData): Promise<void> {
  await decide(formData, 'edit');
}
