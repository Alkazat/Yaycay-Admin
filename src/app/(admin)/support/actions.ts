'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { startSupportSession, endSupportSession } from '@/lib/data';
import { AdminApiError } from '@/lib/data/api';
import { recordAudit } from '@/lib/audit';

/*
 * Support-session ("view-as") write actions. Every action re-checks admin + MFA
 * and records an audit entry. A support session is read-only and time-boxed and
 * never issues a customer credential; opening/closing one is the audited event.
 */

export async function startSupportSessionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireAdmin();
  const targetUserId = String(formData.get('targetUserId') ?? '').trim();
  const targetEmail = String(formData.get('targetEmail') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  // A reason and a target are mandatory; without them, do nothing.
  if ((!targetUserId && !targetEmail) || !reason) return;

  try {
    const started = await startSupportSession({
      ...(targetUserId ? { targetUserId } : {}),
      ...(targetEmail ? { targetEmail } : {}),
      reason,
    });
    await recordAudit({
      actor: session.email,
      action: 'support.start',
      target: started.targetEmail ?? started.targetUserId,
      details: reason,
    });
  } catch (e) {
    // 409 = this admin already has an open session; fall through to /support,
    // which shows it. Anything else is a real error worth surfacing.
    if (!(e instanceof AdminApiError && e.status === 409)) throw e;
  }

  revalidatePath('/support');
  redirect('/support');
}

export async function endSupportSessionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const ended = await endSupportSession(id);
  if (ended) {
    await recordAudit({
      actor: session.email,
      action: 'support.end',
      target: ended.targetEmail ?? ended.targetUserId,
      details: `session ${id}`,
    });
  }
  revalidatePath('/support');
  redirect('/support');
}
