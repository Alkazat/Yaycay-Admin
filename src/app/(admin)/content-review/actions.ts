'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { decideReview, publishEditedContent } from '@/lib/data';
import { recordAudit } from '@/lib/audit';
import type { TripContent } from '@/lib/contracts/types';

/** Approve generated content as is. Re-checks admin + MFA; audited. */
export async function approveAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const tripId = String(formData.get('tripId') ?? '');
  if (!tripId) return;
  const updated = await decideReview(tripId, 'approve');
  if (updated) {
    await recordAudit({
      actor: session.email,
      action: 'content.approve',
      target: tripId,
      details: `now ${updated.status}`,
    });
    revalidatePath('/content-review');
  }
}

export type EditResult = { ok: false; error: string };

/**
 * Publish edited content. Takes the edited TripContent as JSON, validates it,
 * and posts it to the edit endpoint. Redirects back to the list on success.
 */
export async function editContentAction(
  _prev: EditResult | null,
  formData: FormData,
): Promise<EditResult> {
  const session = await requireAdmin();
  const tripId = String(formData.get('tripId') ?? '');
  const raw = String(formData.get('content') ?? '');
  if (!tripId) return { ok: false, error: 'Missing trip id.' };

  let content: TripContent;
  try {
    content = JSON.parse(raw) as TripContent;
  } catch {
    return { ok: false, error: 'Content is not valid JSON.' };
  }
  if (
    typeof content !== 'object' ||
    content === null ||
    !('trip' in content) ||
    !('days' in content)
  ) {
    return {
      ok: false,
      error: 'Content must be a TripContent object with "trip" and "days".',
    };
  }

  const updated = await publishEditedContent(tripId, content);
  if (!updated) {
    return { ok: false, error: 'Could not publish (item may not be pending).' };
  }
  await recordAudit({
    actor: session.email,
    action: 'content.edit',
    target: tripId,
    details: 'edited and published',
  });
  revalidatePath('/content-review');
  redirect('/content-review');
}
