'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { setModelRoute } from '@/lib/data';
import { recordAudit } from '@/lib/audit';
import type { AiModel } from '@/lib/contracts/types';

const MODELS: AiModel[] = ['claude-sonnet', 'claude-opus', 'gemini', 'openai'];

function parseModel(value: FormDataEntryValue | null): AiModel | null {
  return MODELS.includes(value as AiModel) ? (value as AiModel) : null;
}

/** Set a task's default model and optional override. Re-checks admin + MFA; audited. */
export async function setRouteAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const task = String(formData.get('task') ?? '').trim();
  const defaultModel = parseModel(formData.get('defaultModel'));
  const overrideValue = String(formData.get('override') ?? '');
  const override =
    overrideValue === ''
      ? undefined
      : (parseModel(formData.get('override')) ?? undefined);
  if (!task || !defaultModel) return;

  const updated = await setModelRoute(task, defaultModel, override);
  await recordAudit({
    actor: session.email,
    action: 'model-route.set',
    target: task,
    details: `default ${updated.defaultModel}${updated.override ? `, override ${updated.override}` : ''}`,
  });
  revalidatePath('/models');
}
