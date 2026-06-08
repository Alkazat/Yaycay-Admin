'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { createPromptVersion, activatePrompt } from '@/lib/data';
import type { AiModel } from '@/lib/contracts/types';

const MODELS: AiModel[] = ['claude-sonnet', 'claude-opus', 'gemini', 'openai'];

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function parseModel(value: FormDataEntryValue | null): AiModel | null {
  return MODELS.includes(value as AiModel) ? (value as AiModel) : null;
}

/** Create a new version for a task. Every action re-checks admin + MFA. */
export async function createVersionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const task = String(formData.get('task') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const model = parseModel(formData.get('model'));

  if (!task) return { ok: false, error: 'Task is required.' };
  if (!title) return { ok: false, error: 'Title is required.' };
  if (!body) return { ok: false, error: 'Body cannot be empty.' };
  if (!model) return { ok: false, error: 'Pick a valid model.' };

  const created = await createPromptVersion({
    task,
    title,
    body,
    model,
    by: session.email,
  });
  revalidatePath('/prompts');
  return {
    ok: true,
    message: `Saved ${created.task} v${created.version} (inactive).`,
  };
}

/** Activate a specific version for its task. */
export async function activateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (id) {
    await activatePrompt(id);
    revalidatePath('/prompts');
  }
}
