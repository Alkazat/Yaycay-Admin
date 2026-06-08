import type { AiModel, Prompt } from '@/lib/contracts/types';

/*
 * Pure prompt-versioning logic, free of Next.js / Supabase so it can be
 * unit-tested directly (handoff: "prompt-versioning logic"). The rules:
 *
 * - Versions are immutable. Editing a prompt creates a new version for its
 *   task; existing versions are never mutated in place.
 * - Version numbers are per task and monotonic (max + 1).
 * - Exactly one version per task is active. Activating one deactivates the
 *   others for the same task.
 */

export function nextVersionForTask(prompts: Prompt[], task: string): number {
  const versions = prompts.filter((p) => p.task === task).map((p) => p.version);
  return versions.length ? Math.max(...versions) + 1 : 1;
}

export interface NewVersionInput {
  task: string;
  title: string;
  body: string;
  model: AiModel;
  by: string;
  at?: string;
}

/** Builds the next immutable version for a task. Does not activate it. */
export function buildNewVersion(
  prompts: Prompt[],
  input: NewVersionInput,
): Prompt {
  const version = nextVersionForTask(prompts, input.task);
  return {
    id: `${input.task}@v${version}`,
    task: input.task,
    title: input.title,
    body: input.body,
    model: input.model,
    version,
    active: false,
    updatedAt: input.at ?? new Date().toISOString(),
    updatedBy: input.by,
  };
}

/** Returns a new list with `id` active and all sibling versions deactivated. */
export function withActivated(prompts: Prompt[], id: string): Prompt[] {
  const target = prompts.find((p) => p.id === id);
  if (!target) return prompts;
  return prompts.map((p) =>
    p.task === target.task ? { ...p, active: p.id === id } : p,
  );
}

/** The active version for a task, if any. */
export function activeVersion(
  prompts: Prompt[],
  task: string,
): Prompt | undefined {
  return prompts.find((p) => p.task === task && p.active);
}

/** Groups prompts by task, each task's versions sorted newest first. */
export function groupByTask(
  prompts: Prompt[],
): { task: string; versions: Prompt[] }[] {
  const byTask = new Map<string, Prompt[]>();
  for (const p of prompts) {
    const list = byTask.get(p.task) ?? [];
    list.push(p);
    byTask.set(p.task, list);
  }
  return [...byTask.entries()]
    .map(([task, versions]) => ({
      task,
      versions: [...versions].sort((a, b) => b.version - a.version),
    }))
    .sort((a, b) => a.task.localeCompare(b.task));
}
