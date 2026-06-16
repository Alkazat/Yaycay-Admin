import 'server-only';
import { isAdminDataLive } from '@/lib/config';
import type {
  AdminAccount,
  AdminConnector,
  AdminProgress,
  AdminSession,
  Affiliate,
  AffiliateRedemption,
  AffiliateReport,
  AffiliateStatus,
  AiJob,
  AiModel,
  ChildProfile,
  CreateAffiliateInput,
  CreateProductRequest,
  CustomerSummary,
  ModelRoute,
  ProductSummary,
  Prompt,
  Purchase,
  ReviewItem,
  TripContent,
  AdminTripSummary,
  StartSupportSessionInput,
  SupportSession,
  SupportSessionSnapshot,
} from '@/lib/contracts/types';
import { suggestCode, suggestLandingSlug } from '@/lib/affiliates/code';
import * as stubs from '@/lib/data/stubs';
import { devStore } from '@/lib/data/store';
import { adminApi, AdminApiError, type Page } from '@/lib/data/api';
import {
  buildNewVersion,
  withActivated,
  type NewVersionInput,
} from '@/lib/prompts/versioning';
import {
  applyDecision,
  pendingFirst,
  type ReviewDecision,
} from '@/lib/review/state';

/*
 * The admin data layer. Each accessor returns contract-shaped data.
 *
 * When the BE data API is configured (isAdminDataLive), accessors call the
 * live /admin/* surface from @alkazat/contracts via adminApi. Otherwise they
 * serve local fixtures so every screen is navigable without a live BE.
 */

function logAdminError(where: string, e: unknown): void {
  const status = e instanceof AdminApiError ? `status=${e.status} ` : '';
  console.error('[admin-api]', where, status + String(e));
}

/** Run a live read; on any failure log it and return the fallback (fail soft). */
async function safe<T>(
  where: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    logAdminError(where, e);
    return fallback;
  }
}

/**
 * Run a live WRITE; on a contract/API error (e.g. the endpoint is not deployed
 * yet) log it and return the fallback instead of throwing. This keeps a server
 * action from crashing the page with a 500 when BE has not built the endpoint;
 * the caller treats the fallback as "not saved" and tells the user.
 */
async function safeWrite<T>(
  where: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    logAdminError(where, e);
    return fallback;
  }
}

/**
 * Liveness probe for the admin API. Returns ok, or the failing status so a
 * screen can show a clear diagnostic instead of a blank/empty page.
 */
export async function probeAdminApi(): Promise<
  { ok: true } | { ok: false; status: number; message: string }
> {
  if (!isAdminDataLive()) return { ok: true };
  try {
    await adminApi.get<Page<AiJob>>('/admin/jobs');
    return { ok: true };
  } catch (e) {
    if (e instanceof AdminApiError) {
      return { ok: false, status: e.status, message: e.message };
    }
    return { ok: false, status: 0, message: String(e) };
  }
}

export async function listPrompts(): Promise<Prompt[]> {
  if (!isAdminDataLive()) return devStore.getPrompts();
  return safe(
    'listPrompts',
    async () => (await adminApi.get<Page<Prompt>>('/admin/prompts')).items,
    [],
  );
}

/**
 * Create a new version for a task. Contract: POST /admin/prompts/{id}/versions
 * on an existing prompt, or POST /admin/prompts to create the task's first one.
 */
export async function createPromptVersion(
  input: NewVersionInput,
): Promise<Prompt> {
  if (!isAdminDataLive()) {
    const created = buildNewVersion(devStore.getPrompts(), input);
    devStore.addPrompt(created);
    return created;
  }
  const body = { title: input.title, body: input.body, model: input.model };
  const existing = await adminApi.get<Page<Prompt>>(
    `/admin/prompts?task=${encodeURIComponent(input.task)}`,
  );
  const prompt = existing.items[0];
  if (prompt) {
    return adminApi.post<Prompt>(`/admin/prompts/${prompt.id}/versions`, body);
  }
  return adminApi.post<Prompt>('/admin/prompts', { task: input.task, ...body });
}

/** Activate a version, deactivating its siblings (POST /admin/prompts/{id}/activate). */
export async function activatePrompt(id: string): Promise<void> {
  if (!isAdminDataLive()) {
    devStore.replacePrompts(withActivated(devStore.getPrompts(), id));
    return;
  }
  await adminApi.post<Prompt>(`/admin/prompts/${id}/activate`);
}

export async function listModelRoutes(): Promise<ModelRoute[]> {
  if (!isAdminDataLive()) return devStore.getModelRoutes();
  return safe(
    'listModelRoutes',
    async () =>
      (await adminApi.get<{ items: ModelRoute[] }>('/admin/model-routes'))
        .items,
    [],
  );
}

/** Set the default model / override for a task (PUT /admin/model-routes/{task}). */
export async function setModelRoute(
  task: string,
  defaultModel: AiModel,
  override?: AiModel,
): Promise<ModelRoute> {
  if (!isAdminDataLive()) {
    return devStore.setModelRoute({ task, defaultModel, override });
  }
  return adminApi.put<ModelRoute>(
    `/admin/model-routes/${encodeURIComponent(task)}`,
    { defaultModel, override: override ?? null },
  );
}

export async function listJobs(): Promise<AiJob[]> {
  if (!isAdminDataLive()) return devStore.getJobs();
  return safe(
    'listJobs',
    async () => (await adminApi.get<Page<AiJob>>('/admin/jobs')).items,
    [],
  );
}

/** Retry a failed job (POST /admin/jobs/{id}/retry; re-enqueues, cap enforced). */
export async function retryJob(id: string): Promise<AiJob | null> {
  if (!isAdminDataLive()) {
    const original = devStore.findJob(id);
    if (!original || original.status !== 'failed') return null;
    const requeued: AiJob = {
      ...original,
      id: `${original.id}-retry-${Date.now()}`,
      status: 'queued',
      createdAt: new Date().toISOString(),
      error: undefined,
    };
    devStore.addJob(requeued);
    return requeued;
  }
  return adminApi.post<AiJob>(`/admin/jobs/${id}/retry`);
}

export async function listTrips(): Promise<AdminTripSummary[]> {
  if (!isAdminDataLive()) return stubs.stubTrips;
  return safe(
    'listTrips',
    async () =>
      (await adminApi.get<Page<AdminTripSummary>>('/admin/trips')).items,
    [],
  );
}

export interface SearchOpts {
  query?: string;
  cursor?: string;
}

function buildQuery(opts: SearchOpts): string {
  const params = new URLSearchParams();
  if (opts.query) params.set('query', opts.query);
  if (opts.cursor) params.set('cursor', opts.cursor);
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** Search trips by destination / owner email / id (GET /admin/trips?query=&cursor=). */
export async function searchTrips(
  opts: SearchOpts = {},
): Promise<Page<AdminTripSummary>> {
  if (!isAdminDataLive()) {
    const q = (opts.query ?? '').toLowerCase().trim();
    const items = stubs.stubTrips.filter(
      (t) =>
        !q ||
        t.destination.toLowerCase().includes(q) ||
        t.ownerEmail.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    );
    return { items, nextCursor: null };
  }
  return safe(
    'searchTrips',
    () =>
      adminApi.get<Page<AdminTripSummary>>(`/admin/trips${buildQuery(opts)}`),
    { items: [], nextCursor: null },
  );
}

export async function getTripContent(
  tripId: string,
): Promise<TripContent | null> {
  if (!isAdminDataLive()) return stubs.stubTripContent[tripId] ?? null;
  return safe(
    'getTripContent',
    () => adminApi.get<TripContent>(`/admin/trips/${tripId}/content`),
    null,
  );
}

/** Child profiles for a trip (GET /admin/trips/{id}/profiles). */
export async function listTripProfiles(
  tripId: string,
): Promise<ChildProfile[]> {
  if (!isAdminDataLive()) return stubs.stubProfiles[tripId] ?? [];
  return safe(
    'listTripProfiles',
    async () =>
      (
        await adminApi.get<{ items: ChildProfile[] }>(
          `/admin/trips/${tripId}/profiles`,
        )
      ).items,
    [],
  );
}

/** Per-profile progress for a trip (GET /admin/trips/{id}/progress). */
export async function listTripProgress(
  tripId: string,
): Promise<AdminProgress[]> {
  if (!isAdminDataLive()) return stubs.stubProgress[tripId] ?? [];
  return safe(
    'listTripProgress',
    async () =>
      (
        await adminApi.get<{ items: AdminProgress[] }>(
          `/admin/trips/${tripId}/progress`,
        )
      ).items,
    [],
  );
}

export async function listProducts(): Promise<ProductSummary[]> {
  if (!isAdminDataLive()) return stubs.stubProducts;
  return safe(
    'listProducts',
    async () =>
      (await adminApi.get<{ items: ProductSummary[] }>('/admin/products'))
        .items,
    [],
  );
}

export async function listPurchases(): Promise<Purchase[]> {
  if (!isAdminDataLive()) return stubs.stubPurchases;
  return safe(
    'listPurchases',
    async () => (await adminApi.get<Page<Purchase>>('/admin/purchases')).items,
    [],
  );
}

export async function listCustomers(): Promise<CustomerSummary[]> {
  if (!isAdminDataLive()) return devStore.getCustomers();
  return safe(
    'listCustomers',
    async () =>
      (await adminApi.get<Page<CustomerSummary>>('/admin/customers')).items,
    [],
  );
}

/** Search customers by email (GET /admin/customers?query=&cursor=). */
export async function searchCustomers(
  opts: SearchOpts = {},
): Promise<Page<CustomerSummary>> {
  if (!isAdminDataLive()) {
    const q = (opts.query ?? '').toLowerCase().trim();
    const items = devStore
      .getCustomers()
      .filter((c) => !q || c.email.toLowerCase().includes(q));
    return { items, nextCursor: null };
  }
  return safe(
    'searchCustomers',
    () =>
      adminApi.get<Page<CustomerSummary>>(
        `/admin/customers${buildQuery(opts)}`,
      ),
    { items: [], nextCursor: null },
  );
}

/** Record a data-deletion request (POST /admin/customers/{id}/deletion-request). */
export async function requestCustomerDeletion(
  userId: string,
): Promise<CustomerSummary | null> {
  if (!isAdminDataLive()) {
    return devStore.setDeletionRequested(userId, true) ?? null;
  }
  return adminApi.post<CustomerSummary>(
    `/admin/customers/${userId}/deletion-request`,
  );
}

export async function listReviewItems(): Promise<ReviewItem[]> {
  if (!isAdminDataLive()) return pendingFirst(devStore.getReviewItems());
  return safe(
    'listReviewItems',
    async () =>
      pendingFirst(
        (await adminApi.get<Page<ReviewItem>>('/admin/content-review')).items,
      ),
    [],
  );
}

/**
 * Apply a review decision. Contract:
 *  - approve -> POST /admin/content-review/{tripId}/approve
 *  - edit    -> POST /admin/content-review/{tripId}/edit with the TripContent.
 * Until the Admin app has a content editor, "edit" publishes the current
 * content unchanged. Returns the updated item, or null on an invalid stub move.
 */
export async function decideReview(
  tripId: string,
  decision: ReviewDecision,
): Promise<ReviewItem | null> {
  if (!isAdminDataLive()) {
    const current = devStore.getReviewItems();
    const next = applyDecision(current, tripId, decision);
    const updated = next.find((r) => r.tripId === tripId);
    if (
      !updated ||
      updated.status === current.find((c) => c.tripId === tripId)?.status
    ) {
      return null;
    }
    return devStore.setReviewStatus(tripId, updated.status) ?? null;
  }
  if (decision === 'approve') {
    return adminApi.post<ReviewItem>(`/admin/content-review/${tripId}/approve`);
  }
  const content = await adminApi.get<TripContent>(
    `/admin/trips/${tripId}/content`,
  );
  return adminApi.post<ReviewItem>(
    `/admin/content-review/${tripId}/edit`,
    content,
  );
}

/**
 * Publish edited content (POST /admin/content-review/{tripId}/edit with the
 * edited TripContent). In stub mode the edit is persisted to the dev content
 * map and the item is marked `edited`.
 */
export async function publishEditedContent(
  tripId: string,
  content: TripContent,
): Promise<ReviewItem | null> {
  if (!isAdminDataLive()) {
    stubs.stubTripContent[tripId] = content;
    return devStore.setReviewStatus(tripId, 'edited') ?? null;
  }
  return adminApi.post<ReviewItem>(
    `/admin/content-review/${tripId}/edit`,
    content,
  );
}

// ===========================================================================
// /admin/me, admin management, and commerce writes
// ===========================================================================

/** The resolved admin session from BE (GET /admin/me). Stub: a dev session. */
export async function getAdminMe(): Promise<AdminSession | null> {
  if (!isAdminDataLive()) {
    return {
      userId: 'dev-admin',
      email: 'dev-admin@yaycay.local',
      role: 'admin',
      mfaVerified: true,
    };
  }
  return safe(
    'getAdminMe',
    () => adminApi.get<AdminSession>('/admin/me'),
    null,
  );
}

/**
 * List admin accounts (GET /admin/admins). BE endpoint pending - see the BE
 * verification checklist; fails soft to [] live, stub list otherwise.
 */
export async function listAdmins(): Promise<AdminAccount[]> {
  if (!isAdminDataLive()) {
    return [
      {
        userId: 'u_dev',
        email: 'dyeates@dwhy.com.au',
        role: 'admin',
        createdAt: '2026-06-13T00:00:00Z',
      },
    ];
  }
  return safe(
    'listAdmins',
    async () =>
      (await adminApi.get<{ items: AdminAccount[] }>('/admin/admins')).items,
    [],
  );
}

/** Promote an account to admin by email (POST /admin/admins). BE endpoint pending. */
export async function promoteAdmin(
  email: string,
): Promise<AdminAccount | null> {
  if (!isAdminDataLive()) {
    return { userId: `u_${email}`, email, role: 'admin' };
  }
  return adminApi.post<AdminAccount>('/admin/admins', { email, role: 'admin' });
}

/** Create a catalogue product (POST /admin/products). Stamps the deploy's Stripe mode. */
export async function createProduct(
  input: CreateProductRequest,
): Promise<ProductSummary | null> {
  if (!isAdminDataLive()) {
    return {
      priceId: input.priceId,
      name: input.name,
      amountUsd: input.amountUsd,
      kind: input.kind ?? 'tier',
      tier: input.tier,
      extendsMonths: input.extendsMonths,
      active: input.active ?? true,
    };
  }
  return adminApi.post<ProductSummary>('/admin/products', input);
}

// ===========================================================================
// Affiliate / influencer program
//
// Operator surface for the influencer program. The BE endpoints are pending
// (docs/HANDOFF-affiliate-program-BE.md); until they land these serve the stub
// layer, and reads fail soft to empty like every other admin read.
// ===========================================================================

export async function listAffiliates(): Promise<Affiliate[]> {
  if (!isAdminDataLive()) return devStore.getAffiliates();
  return safe(
    'listAffiliates',
    async () =>
      (await adminApi.get<Page<Affiliate>>('/admin/affiliates')).items,
    [],
  );
}

export async function getAffiliate(code: string): Promise<Affiliate | null> {
  if (!isAdminDataLive()) return devStore.findAffiliate(code) ?? null;
  return safe(
    'getAffiliate',
    () =>
      adminApi.get<Affiliate>(`/admin/affiliates/${encodeURIComponent(code)}`),
    null,
  );
}

/**
 * Create an affiliate. The code + landing slug are derived from the handle and
 * discount here so the operator sees them before submitting; BE is the
 * authority that registers the Stripe coupon and guarantees code uniqueness
 * (POST /admin/affiliates).
 */
export async function createAffiliate(
  input: CreateAffiliateInput,
): Promise<Affiliate | null> {
  const code = suggestCode(input.handle, input.discountPercent);
  const landingSlug = suggestLandingSlug(input.handle);
  if (!isAdminDataLive()) {
    const created: Affiliate = {
      id: `aff_${Date.now()}`,
      name: input.name,
      email: input.email,
      handle: input.handle,
      code,
      discountPercent: input.discountPercent,
      commissionPercent: input.commissionPercent,
      landingSlug,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    devStore.addAffiliate(created);
    return created;
  }
  return safeWrite(
    'createAffiliate',
    () =>
      adminApi.post<Affiliate>('/admin/affiliates', {
        ...input,
        code,
        landingSlug,
      }),
    null,
  );
}

/** Pause or reactivate an affiliate (PATCH /admin/affiliates/{code}). */
export async function setAffiliateStatus(
  code: string,
  status: AffiliateStatus,
): Promise<Affiliate | null> {
  if (!isAdminDataLive()) {
    return devStore.setAffiliateStatus(code, status) ?? null;
  }
  return safeWrite(
    'setAffiliateStatus',
    () =>
      adminApi.patch<Affiliate>(
        `/admin/affiliates/${encodeURIComponent(code)}`,
        {
          status,
        },
      ),
    null,
  );
}

/** Purchases attributed to an affiliate code (GET /admin/affiliates/{code}/redemptions). */
export async function listAffiliateRedemptions(
  code: string,
): Promise<AffiliateRedemption[]> {
  if (!isAdminDataLive()) return stubs.stubRedemptions[code] ?? [];
  return safe(
    'listAffiliateRedemptions',
    async () =>
      (
        await adminApi.get<Page<AffiliateRedemption>>(
          `/admin/affiliates/${encodeURIComponent(code)}/redemptions`,
        )
      ).items,
    [],
  );
}

/**
 * Send the monthly report to the influencer. BE renders + sends via the
 * transactional sender (Brevo) and records it (POST
 * /admin/affiliates/{code}/report). In stub mode this is a no-op that reports
 * the recipient so the screen can confirm the action.
 */
export async function sendAffiliateReport(
  code: string,
  report: AffiliateReport,
  to: string,
): Promise<{ sent: boolean; to: string }> {
  if (!isAdminDataLive()) return { sent: true, to };
  return safeWrite<{ sent: boolean; to: string }>(
    'sendAffiliateReport',
    async () => {
      await adminApi.post(
        `/admin/affiliates/${encodeURIComponent(code)}/report`,
        { periodStart: report.periodStart, periodEnd: report.periodEnd },
      );
      return { sent: true, to };
    },
    { sent: false, to },
  );
}

// ===========================================================================
// Admin support sessions ("view-as")
//
// A time-boxed, reason-gated, audited inspection of ONE customer's data. No
// customer credential is ever minted - reads go through the AAL2-gated
// /admin/support-sessions/* surface; the session scopes, logs and expires that
// access. Stub mode keeps the screen navigable without a live BE.
// ===========================================================================

/** List support sessions (GET /admin/support-sessions[?active=true]). */
export async function listSupportSessions(
  activeOnly = false,
): Promise<SupportSession[]> {
  if (!isAdminDataLive()) return devStore.getSupportSessions(activeOnly);
  const qs = activeOnly ? '?active=true' : '';
  return safe(
    'listSupportSessions',
    async () =>
      (await adminApi.get<Page<SupportSession>>(`/admin/support-sessions${qs}`))
        .items,
    [],
  );
}

/** Open a support session for one customer (POST /admin/support-sessions). */
export async function startSupportSession(
  input: StartSupportSessionInput,
): Promise<SupportSession> {
  if (!isAdminDataLive()) return devStore.startSupportSession(input);
  return adminApi.post<SupportSession>('/admin/support-sessions', input);
}

/** Close an open session (POST /admin/support-sessions/{id}/end). */
export async function endSupportSession(
  id: string,
): Promise<SupportSession | null> {
  if (!isAdminDataLive()) return devStore.endSupportSession(id) ?? null;
  return adminApi.post<SupportSession>(`/admin/support-sessions/${id}/end`);
}

/** Read-only customer snapshot for an active session (GET .../{id}/snapshot). */
export async function getSupportSessionSnapshot(
  id: string,
): Promise<SupportSessionSnapshot | null> {
  if (!isAdminDataLive()) return devStore.getSupportSnapshot(id) ?? null;
  return safe(
    'getSupportSessionSnapshot',
    () =>
      adminApi.get<SupportSessionSnapshot>(
        `/admin/support-sessions/${id}/snapshot`,
      ),
    null,
  );
}

// ===========================================================================
// BYO-AI MCP connectors (Connected assistants)
//
// Cross-account ops view of the OAuth grants behind the FE's MCP server. The
// BE endpoints are pending (docs/HANDOFF-connectors-admin-BE.md); until they
// land these serve the stub layer, and the list read fails soft to empty.
// ===========================================================================

/** List connected assistants, optionally filtered by owner email / assistant. */
export async function listConnectors(
  opts: SearchOpts = {},
): Promise<Page<AdminConnector>> {
  if (!isAdminDataLive()) {
    const q = (opts.query ?? '').toLowerCase().trim();
    const items = devStore
      .getConnectors()
      .filter(
        (c) =>
          !q ||
          c.ownerEmail.toLowerCase().includes(q) ||
          c.assistant.toLowerCase().includes(q),
      );
    return { items, nextCursor: null };
  }
  return safe(
    'listConnectors',
    () =>
      adminApi.get<Page<AdminConnector>>(
        `/admin/connectors${buildQuery(opts)}`,
      ),
    { items: [], nextCursor: null },
  );
}

/** Revoke a connected assistant (POST /admin/connectors/{id}/revoke). */
export async function revokeConnector(
  id: string,
): Promise<AdminConnector | null> {
  if (!isAdminDataLive()) return devStore.revokeConnector(id) ?? null;
  return safeWrite(
    'revokeConnector',
    () =>
      adminApi.post<AdminConnector>(
        `/admin/connectors/${encodeURIComponent(id)}/revoke`,
      ),
    null,
  );
}

/** Patch a product, e.g. activate/deactivate (PATCH /admin/products/{priceId}). */
export async function setProductActive(
  priceId: string,
  active: boolean,
): Promise<ProductSummary | null> {
  if (!isAdminDataLive()) {
    return { priceId, name: priceId, amountUsd: 0, kind: 'tier', active };
  }
  return adminApi.patch<ProductSummary>(
    `/admin/products/${encodeURIComponent(priceId)}`,
    { active },
  );
}
