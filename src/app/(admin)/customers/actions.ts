'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { requestCustomerDeletion } from '@/lib/data';
import { recordAudit } from '@/lib/audit';

/*
 * Record a data-deletion request for a customer. This is the explicit, audited
 * customer edit from the handoff (read-only by default; writes are deliberate
 * and logged). Re-checks admin + MFA.
 */
export async function deletionRequestAction(formData: FormData): Promise<void> {
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
    revalidatePath('/customers');
  }
}
