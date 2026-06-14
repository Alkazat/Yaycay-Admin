import 'server-only';
import { randomUUID } from 'node:crypto';
import type {
  Affiliate,
  AffiliateStatus,
  AiJob,
  AuditEntry,
  CustomerSummary,
  ModelRoute,
  Prompt,
  ReviewItem,
  ReviewStatus,
  StartSupportSessionInput,
  SupportSession,
  SupportSessionSnapshot,
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
const reviewItems: ReviewItem[] = stubs.stubReviewItems.map((r) => ({ ...r }));
const affiliates: Affiliate[] = stubs.stubAffiliates.map((a) => ({ ...a }));
const audit: AuditEntry[] = [];
const supportSessions: SupportSession[] = [];

function withActive(s: SupportSession): SupportSession {
  return {
    ...s,
    active: s.endedAt == null && new Date(s.expiresAt).getTime() > Date.now(),
  };
}

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
  setModelRoute(route: ModelRoute): ModelRoute {
    const existing = modelRoutes.find((r) => r.task === route.task);
    if (existing) {
      existing.defaultModel = route.defaultModel;
      existing.override = route.override;
    } else {
      modelRoutes.push({ ...route });
    }
    return { ...route };
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
  getReviewItems(): ReviewItem[] {
    return reviewItems.map((r) => ({ ...r }));
  },
  setReviewStatus(
    tripId: string,
    status: ReviewStatus,
  ): ReviewItem | undefined {
    const found = reviewItems.find((r) => r.tripId === tripId);
    if (!found) return undefined;
    found.status = status;
    return { ...found };
  },
  getAffiliates(): Affiliate[] {
    return affiliates.map((a) => ({ ...a }));
  },
  findAffiliate(code: string): Affiliate | undefined {
    const found = affiliates.find((a) => a.code === code);
    return found ? { ...found } : undefined;
  },
  addAffiliate(affiliate: Affiliate): void {
    affiliates.unshift({ ...affiliate });
  },
  setAffiliateStatus(
    code: string,
    status: AffiliateStatus,
  ): Affiliate | undefined {
    const found = affiliates.find((a) => a.code === code);
    if (!found) return undefined;
    found.status = status;
    return { ...found };
  },
  getAudit(): AuditEntry[] {
    return audit.map((a) => ({ ...a }));
  },
  addAudit(entry: AuditEntry): void {
    audit.unshift({ ...entry });
  },
  getSupportSessions(activeOnly = false): SupportSession[] {
    return supportSessions
      .map(withActive)
      .filter((s) => (activeOnly ? s.active : true));
  },
  startSupportSession(input: StartSupportSessionInput): SupportSession {
    const target =
      (input.targetUserId &&
        customers.find((c) => c.userId === input.targetUserId)) ||
      (input.targetEmail &&
        customers.find(
          (c) => c.email.toLowerCase() === input.targetEmail!.toLowerCase(),
        )) ||
      undefined;
    const ttl = Math.min(Math.max(Math.floor(input.ttlMinutes ?? 30), 1), 120);
    const now = Date.now();
    const session: SupportSession = {
      id: randomUUID(),
      actorId: 'dev-admin',
      actorEmail: 'dev-admin@yaycay.local',
      targetUserId: target?.userId ?? input.targetUserId ?? 'unknown',
      targetEmail: target?.email ?? input.targetEmail ?? null,
      reason: input.reason,
      mode: 'read_only',
      startedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttl * 60_000).toISOString(),
      endedAt: null,
      endedReason: null,
      active: true,
    };
    supportSessions.unshift(session);
    return { ...session };
  },
  endSupportSession(id: string): SupportSession | undefined {
    const found = supportSessions.find((s) => s.id === id);
    if (!found) return undefined;
    if (!found.endedAt) {
      found.endedAt = new Date().toISOString();
      found.endedReason = 'manual';
    }
    return withActive(found);
  },
  getSupportSnapshot(id: string): SupportSessionSnapshot | undefined {
    const found = supportSessions.find((s) => s.id === id);
    if (!found) return undefined;
    const customer = customers.find((c) => c.userId === found.targetUserId);
    if (!customer) return undefined;
    return {
      session: withActive(found),
      customer: { ...customer },
      profiles: [],
      trips: stubs.stubTrips.filter((t) => t.ownerEmail === customer.email),
    };
  },
};
