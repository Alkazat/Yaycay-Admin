import 'server-only';
import { randomUUID } from 'node:crypto';
import type {
  AdminAccount,
  AdminConnector,
  AdminTripSummary,
  AdminUserRow,
  Affiliate,
  AffiliateStatus,
  AiJob,
  AuditEntry,
  CreateTripInput,
  CustomerSummary,
  DeletionRequestItem,
  ModelRoute,
  Prompt,
  ReviewItem,
  ReviewStatus,
  StartSupportSessionInput,
  SupportSession,
  SupportSessionSnapshot,
} from '@/lib/contracts/types';
import * as stubs from '@/lib/data/stubs';
import type { StubUser } from '@/lib/data/stubs';

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
const users: StubUser[] = stubs.stubUsers.map((c) => ({ ...c }));
const trips: AdminTripSummary[] = stubs.stubTrips.map((t) => ({ ...t }));
const reviewItems: ReviewItem[] = stubs.stubReviewItems.map((r) => ({ ...r }));
const affiliates: Affiliate[] = stubs.stubAffiliates.map((a) => ({ ...a }));
const connectors: AdminConnector[] = stubs.stubConnectors.map((c) => ({
  ...c,
}));
const audit: AuditEntry[] = [];
const supportSessions: SupportSession[] = [];
const admins: AdminAccount[] = [
  {
    userId: 'u_dev',
    email: 'dyeates@dwhy.com.au',
    role: 'admin',
    createdAt: '2026-06-13T00:00:00Z',
  },
];

/** Project a stored rich user down to the thin contract CustomerSummary. */
function toThin(u: StubUser): CustomerSummary {
  return {
    userId: u.userId,
    email: u.email,
    tier: u.tier,
    retentionExpiresAt: u.retentionExpiresAt,
    deletionRequested: u.deletionRequested,
  };
}

/** Enrich a stored user into a table row, deriving tripCount from trips. */
function toRow(u: StubUser): AdminUserRow {
  return {
    ...u,
    tripCount: trips.filter((t) => t.ownerEmail === u.email).length,
  };
}

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
    return users.map(toThin);
  },
  getUsers(): AdminUserRow[] {
    return users.map(toRow);
  },
  addCustomer(customer: CustomerSummary): CustomerSummary {
    const existing = users.find((c) => c.email === customer.email);
    if (existing) return toThin(existing);
    // A manual invite: pending account, no login yet, no profiles.
    const seed: StubUser = {
      ...customer,
      status: 'invited',
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      explorerCount: 0,
      grownupCount: 0,
    };
    users.unshift(seed);
    return toThin(seed);
  },
  updateUserEmail(userId: string, email: string): AdminUserRow | undefined {
    const found = users.find((c) => c.userId === userId);
    if (!found) return undefined;
    // Cascade to owned trips so trip ownership and #trips stay correct.
    for (const t of trips)
      if (t.ownerEmail === found.email) t.ownerEmail = email;
    found.email = email;
    return toRow(found);
  },
  setDeletionRequested(
    userId: string,
    value: boolean,
  ): CustomerSummary | undefined {
    const found = users.find((c) => c.userId === userId);
    if (!found) return undefined;
    found.deletionRequested = value;
    found.status = value
      ? 'deletion-requested'
      : found.lastLoginAt
        ? 'active'
        : 'invited';
    return toThin(found);
  },
  /** Execute a pending deletion: purge the user and their trips. */
  executeDeletion(userId: string): boolean {
    const i = users.findIndex((c) => c.userId === userId);
    if (i === -1) return false;
    const [removed] = users.splice(i, 1);
    for (let j = trips.length - 1; j >= 0; j--) {
      if (trips[j].ownerEmail === removed.email) trips.splice(j, 1);
    }
    return true;
  },
  /** Hard-remove a user (used for never-activated invites). */
  removeUser(userId: string): boolean {
    const i = users.findIndex((c) => c.userId === userId);
    if (i === -1) return false;
    users.splice(i, 1);
    return true;
  },
  getTrips(): AdminTripSummary[] {
    return trips.map((t) => ({ ...t }));
  },
  addTrip(input: CreateTripInput): AdminTripSummary {
    const trip: AdminTripSummary = {
      id: `t_${randomUUID().slice(0, 8)}`,
      destination: input.destination,
      ownerEmail: input.ownerEmail,
      tier: input.tier,
      status: 'planning',
      startDate: input.startDate,
      endDate: input.endDate,
      retentionExpiresAt: null,
    };
    trips.unshift(trip);
    return { ...trip };
  },
  removeTrip(id: string): boolean {
    const i = trips.findIndex((t) => t.id === id);
    if (i === -1) return false;
    trips.splice(i, 1);
    return true;
  },
  // The deletion queue, derived from the requested users. Stubs are dated 40
  // days ago so they read as past-grace (eligible) and exercise execute.
  getDeletionRequests(): DeletionRequestItem[] {
    const DAY_MS = 86_400_000;
    const requestedAt = new Date(Date.now() - 40 * DAY_MS).toISOString();
    const eligibleAt = new Date(
      new Date(requestedAt).getTime() + 30 * DAY_MS,
    ).toISOString();
    return users
      .filter((u) => u.deletionRequested)
      .map((u) => ({
        userId: u.userId,
        email: u.email,
        requestedAt,
        ageDays: 40,
        eligibleAt,
        eligible: true,
        tier: u.tier,
        trips: trips.filter((t) => t.ownerEmail === u.email).length,
        media: 0,
        purchases: 0,
      }));
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
  updateAffiliate(
    code: string,
    patch: Partial<Affiliate>,
  ): Affiliate | undefined {
    const found = affiliates.find((a) => a.code === code);
    if (!found) return undefined;
    Object.assign(found, patch);
    return { ...found };
  },
  removeAffiliate(code: string): boolean {
    const i = affiliates.findIndex((a) => a.code === code);
    if (i === -1) return false;
    affiliates.splice(i, 1);
    return true;
  },
  getConnectors(): AdminConnector[] {
    return connectors.map((c) => ({ ...c }));
  },
  revokeConnector(id: string): AdminConnector | undefined {
    const found = connectors.find((c) => c.id === id);
    if (!found) return undefined;
    found.status = 'revoked';
    return { ...found };
  },
  getAdmins(): AdminAccount[] {
    return admins.map((a) => ({ ...a }));
  },
  addAdminAccount(account: AdminAccount): AdminAccount {
    const existing = admins.find((a) => a.email === account.email);
    if (existing) {
      existing.role = account.role;
      return { ...existing };
    }
    admins.push({ ...account });
    return { ...account };
  },
  removeAdmin(email: string): AdminAccount | null {
    const i = admins.findIndex((a) => a.email === email);
    if (i === -1) return null;
    const [removed] = admins.splice(i, 1);
    return { ...removed, role: 'user' };
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
        users.find((c) => c.userId === input.targetUserId)) ||
      (input.targetEmail &&
        users.find(
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
    const customer = users.find((c) => c.userId === found.targetUserId);
    if (!customer) return undefined;
    return {
      session: withActive(found),
      customer: toThin(customer),
      profiles: [],
      trips: trips.filter((t) => t.ownerEmail === customer.email),
    };
  },
};
