'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { retryJob } from '@/lib/data';

/** Retry a failed job (re-enqueues a new ai_jobs row). Re-checks admin + MFA. */
export async function retryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (id) {
    await retryJob(id);
    revalidatePath('/jobs');
  }
}
