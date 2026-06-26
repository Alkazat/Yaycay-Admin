'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import {
  executeCustomerDeletion,
  inviteCustomer,
  removeCustomer,
  requestCustomerDeletion,
  updateCustomerEmail,
} from '@/lib/data';
import { recordAudit } from '@/lib/audit';

/** Query string for a failed write: the HTTP status + a trimmed BE detail. */
function failQuery(status: number, detail: string): string {
  const d = detail ? `&detail=${encodeURIComponent(detail.slice(0, 180))}` : '';
  return `notice=backend&status=${status}${d}`;
}

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
    redirect(`/customers?${failQuery(result.status, result.detail)}`);
  }
  await recordAudit({
    actor: session.email,
    action: 'customer.invite',
    target: email,
  });
  revalidatePath('/customers');
  redirect(`/customers?notice=invited&q=${encodeURIComponent(email)}`);
}

/**
 * Change a user's email address. Audited; reports the HTTP status on failure.
 */
export async function changeEmailAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!userId || !email) return;

  const result = await updateCustomerEmail(userId, { email });
  if (!result.ok) {
    redirect(`/customers?${failQuery(result.status, result.detail)}`);
  }
  await recordAudit({
    actor: session.email,
    action: 'customer.email-change',
    target: userId,
    details: `-> ${email}`,
  });
  revalidatePath('/customers');
  redirect(`/customers?notice=emailchanged&q=${encodeURIComponent(email)}`);
}

/*
 * Record a data-deletion request for a customer (step 1 of 2). Marks + schedules
 * the GDPR deletion; the irreversible purge is a separate, explicit execute.
 * Re-checks admin + MFA; audited.
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
  redirect('/customers?notice=requested');
}

/**
 * Execute a pending deletion (step 2 of 2): irreversible purge of the user and
 * their data. Guarded by a typed confirmation in the form. Audited.
 */
export async function executeDeletionAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const confirm = String(formData.get('confirm') ?? '').trim();
  if (!userId || confirm !== 'DELETE') {
    redirect('/customers?notice=confirm');
  }

  const result = await executeCustomerDeletion(userId);
  if (!result.ok) {
    redirect(`/customers?${failQuery(result.status, result.detail)}`);
  }
  await recordAudit({
    actor: session.email,
    action: 'customer.deletion-execute',
    target: userId,
  });
  revalidatePath('/customers');
  redirect('/customers?notice=deleted');
}

/**
 * Hard-remove a never-activated invite. Audited. (For activated accounts use the
 * two-step deletion flow instead.)
 */
export async function removeUserAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return;

  const result = await removeCustomer(userId);
  if (!result.ok) {
    redirect(`/customers?${failQuery(result.status, result.detail)}`);
  }
  await recordAudit({
    actor: session.email,
    action: 'customer.remove-invite',
    target: userId,
  });
  revalidatePath('/customers');
  redirect('/customers?notice=removed');
}
