'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { inviteCustomer, requestCustomerDeletion } from '@/lib/data';
import { recordAudit } from '@/lib/audit';

/**
 * Invite / onboard a new customer by email. BE provisions a pending account and
 * sends a magic-link invite (no password). Audited; reports the HTTP status on
 * failure so a missing endpoint reads clearly rather than silently failing.
 */
export async function inviteUserAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const name = String(formData.get('name') ?? '').trim() || undefined;
  if (!email) return;

  const result = await inviteCustomer({ email, name });
  if (!result.ok) {
    const d = result.detail
      ? `&detail=${encodeURIComponent(result.detail.slice(0, 180))}`
      : '';
    redirect(`/customers?notice=backend&status=${result.status}${d}`);
  }
  await recordAudit({
    actor: session.email,
    action: 'customer.invite',
    target: email,
  });
  revalidatePath('/customers');
  redirect(`/customers?notice=invited&q=${encodeURIComponent(email)}`);
}

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
