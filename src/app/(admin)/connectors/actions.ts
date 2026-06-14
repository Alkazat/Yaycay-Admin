'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { revokeConnector } from '@/lib/data';
import { recordAudit } from '@/lib/audit';

/*
 * Revoke a connected assistant (an OAuth grant). This is the ops kill switch
 * for a compromised or unwanted connector. Re-checks admin + MFA and records
 * an audit entry, like every other admin write.
 */
export async function revokeConnectorAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const updated = await revokeConnector(id);
  if (updated) {
    await recordAudit({
      actor: session.email,
      action: 'connector.revoke',
      target: id,
      details: `${updated.assistant} for ${updated.ownerEmail}`,
    });
    revalidatePath('/connectors');
  }
}
