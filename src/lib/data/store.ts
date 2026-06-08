import 'server-only';
import type {
  AiJob,
  AuditEntry,
  CustomerSummary,
  ModelRoute,
  Prompt,
} from '@/lib/contracts/types';
import * as stubs from '@/lib/data/stubs';

/*
 * Mutable in-memory store for dev / stub mode ONLY.
 *
 * Seeded from the fixtures, it lets write actions (create a prompt version,
 * activate one) take effect during local development without a live BE. It
 * resets on server restart and is process-local, so it must never be relied on
 * in production - production takes the real BE path and never touches this.
 */

const prompts: Prompt[] = stubs.stubPrompts.map((p) => ({ ...p }));
const modelRoutes: ModelRoute[] = stubs.stubModelRoutes.map((r) => ({ ...r }));
const jobs: AiJob[] = stubs.stubJobs.map((j) => ({ ...j }));
const customers: CustomerSummary[] = stubs.stubCustomers.map((c) => ({ ...c }));
const audit: AuditEntry[] = [];

export const devStore = {
  getPrompts(): Prompt[] {
    return prompts.map((p) => ({ ...p }));
  },
  addPrompt(prompt: Prompt): void {
    prompts.push({ ...prompt });
  },
  replacePrompts(next: Prompt[]): void {
    prompts.splice(0, prompts.length, ...next.map((p) => ({ ...p })));
  },
  getModelRoutes(): ModelRoute[] {
    return modelRoutes.map((r) => ({ ...r }));
  },
  getJobs(): AiJob[] {
    return jobs.map((j) => ({ ...j }));
  },
  findJob(id: string): AiJob | undefined {
    const found = jobs.find((j) => j.id === id);
    return found ? { ...found } : undefined;
  },
  addJob(job: AiJob): void {
    jobs.unshift({ ...job });
  },
  getCustomers(): CustomerSummary[] {
    return customers.map((c) => ({ ...c }));
  },
  setDeletionRequested(
    userId: string,
    value: boolean,
  ): CustomerSummary | undefined {
    const found = customers.find((c) => c.userId === userId);
    if (!found) return undefined;
    found.deletionRequested = value;
    return { ...found };
  },
  getAudit(): AuditEntry[] {
    return audit.map((a) => ({ ...a }));
  },
  addAudit(entry: AuditEntry): void {
    audit.unshift({ ...entry });
  },
};
