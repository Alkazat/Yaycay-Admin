'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import {
  requestCustomerDeletion,
  cancelDeletionRequest,
  executeDeletionRequest,
} from '@/lib/data';
import { recordAudit } from '@/lib/audit';

/*
 * The GDPR deletion-queue actions. All re-check admin + MFA and are audited.
 * Request schedules a (reversible) deletion; cancel clears it; execute is the
 * irreversible purge - the BE confirms the typed email and enforces the 30-day
 * grace unless force, surfacing any 4xx via ?notice=backend.
 */

function failQuery(status: number, detail: string): string {
  const d = detail ? `&detail=${encodeURIComponent(detail.slice(0, 180))}` : '';
  return `notice=backend&status=${status}${d}`;
}

/** Schedule a deletion for an account opened from the Users row (focus link). */
export async function requestDeletionAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return;

  const updated = await requestCustomerDeletion(userId);
  if (updated) {
    await recordAudit({
      actor: session.email,
      action: 'customer.deletion-request',
      target: userId,
      details: updated.email,
    });
  }
  revalidatePath('/deletion-requests');
  redirect('/deletion-requests?notice=requested');
}

/** Cancel a pending request (reversible). */
export async function cancelDeletionAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return;

  await cancelDeletionRequest(userId);
  await recordAudit({
    actor: session.email,
    action: 'customer.deletion-cancel',
    target: userId,
  });
  revalidatePath('/deletion-requests');
  redirect('/deletion-requests?notice=cancelled');
}

/** Execute the irreversible purge (typed-email confirm + optional grace skip). */
export async function executeDeletionAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const email = String(formData.get('confirmEmail') ?? '').trim();
  const force = formData.get('force') === 'on';
  if (!userId) return;

  const result = await executeDeletionRequest(userId, email, force);
  if (!result.ok) {
    redirect(`/deletion-requests?${failQuery(result.status, result.detail)}`);
  }
  await recordAudit({
    actor: session.email,
    action: 'customer.deletion-execute',
    target: userId,
    details: force ? 'forced (skip grace)' : '',
  });
  revalidatePath('/deletion-requests');
  redirect('/deletion-requests?notice=deleted');
}
