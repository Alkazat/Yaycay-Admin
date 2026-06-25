'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { setAdminRole } from '@/lib/data';
import { recordAudit } from '@/lib/audit';

/** Promote an account to admin by email. Re-checks admin + MFA; audited. */
export async function promoteAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!email) return;
  const updated = await setAdminRole(email, 'admin');
  if (updated) {
    await recordAudit({
      actor: session.email,
      action: 'admin.promote',
      target: email,
    });
    revalidatePath('/admins');
  }
}

/**
 * Revoke an account's admin role (demote to user). Guards against revoking
 * yourself, so you can't lock yourself out of the console. Audited.
 */
export async function revokeAdminAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!email || email === session.email.toLowerCase()) return;
  const updated = await setAdminRole(email, 'user');
  if (updated) {
    await recordAudit({
      actor: session.email,
      action: 'admin.revoke',
      target: email,
    });
    revalidatePath('/admins');
  }
}
