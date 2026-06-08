'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { retryJob } from '@/lib/data';
import { recordAudit } from '@/lib/audit';

/** Retry a failed job (re-enqueues a new ai_jobs row). Re-checks admin + MFA. */
export async function retryAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (id) {
    const requeued = await retryJob(id);
    if (requeued) {
      await recordAudit({
        actor: session.email,
        action: 'job.retry',
        target: id,
        details: `re-enqueued as ${requeued.id}`,
      });
    }
    revalidatePath('/jobs');
  }
}
