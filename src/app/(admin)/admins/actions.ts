'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { promoteAdmin } from '@/lib/data';
import { recordAudit } from '@/lib/audit';

/** Promote an account to admin by email. Re-checks admin + MFA; audited. */
export async function promoteAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!email) return;
  const updated = await promoteAdmin(email);
  if (updated) {
    await recordAudit({
      actor: session.email,
      action: 'admin.promote',
      target: email,
    });
    revalidatePath('/admins');
  }
}
