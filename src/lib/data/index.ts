import 'server-only';
import { isAdminDataLive } from '@/lib/config';
import type {
  AdminProgress,
  AiJob,
  AiModel,
  ChildProfile,
  CustomerSummary,
  ModelRoute,
  ProductSummary,
  Prompt,
  Purchase,
  ReviewItem,
  TripContent,
  TripSummary,
} from '@/lib/contracts/types';
import * as stubs from '@/lib/data/stubs';
import { devStore } from '@/lib/data/store';
import { adminApi, type Page } from '@/lib/data/api';
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

export async function listPrompts(): Promise<Prompt[]> {
  if (!isAdminDataLive()) return devStore.getPrompts();
  const page = await adminApi.get<Page<Prompt>>('/admin/prompts');
  return page.items;
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
  const res = await adminApi.get<{ items: ModelRoute[] }>(
    '/admin/model-routes',
  );
  return res.items;
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
  const page = await adminApi.get<Page<AiJob>>('/admin/jobs');
  return page.items;
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

export async function listTrips(): Promise<TripSummary[]> {
  if (!isAdminDataLive()) return stubs.stubTrips;
  const page = await adminApi.get<Page<TripSummary>>('/admin/trips');
  return page.items;
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
): Promise<Page<TripSummary>> {
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
  return adminApi.get<Page<TripSummary>>(`/admin/trips${buildQuery(opts)}`);
}

export async function getTripContent(
  tripId: string,
): Promise<TripContent | null> {
  if (!isAdminDataLive()) return stubs.stubTripContent[tripId] ?? null;
  try {
    return await adminApi.get<TripContent>(`/admin/trips/${tripId}/content`);
  } catch {
    return null;
  }
}

/** Child profiles for a trip (GET /admin/trips/{id}/profiles). */
export async function listTripProfiles(
  tripId: string,
): Promise<ChildProfile[]> {
  if (!isAdminDataLive()) return stubs.stubProfiles[tripId] ?? [];
  const res = await adminApi.get<{ items: ChildProfile[] }>(
    `/admin/trips/${tripId}/profiles`,
  );
  return res.items;
}

/** Per-profile progress for a trip (GET /admin/trips/{id}/progress). */
export async function listTripProgress(
  tripId: string,
): Promise<AdminProgress[]> {
  if (!isAdminDataLive()) return stubs.stubProgress[tripId] ?? [];
  const res = await adminApi.get<{ items: AdminProgress[] }>(
    `/admin/trips/${tripId}/progress`,
  );
  return res.items;
}

export async function listProducts(): Promise<ProductSummary[]> {
  if (!isAdminDataLive()) return stubs.stubProducts;
  const res = await adminApi.get<{ items: ProductSummary[] }>(
    '/admin/products',
  );
  return res.items;
}

export async function listPurchases(): Promise<Purchase[]> {
  if (!isAdminDataLive()) return stubs.stubPurchases;
  const page = await adminApi.get<Page<Purchase>>('/admin/purchases');
  return page.items;
}

export async function listCustomers(): Promise<CustomerSummary[]> {
  if (!isAdminDataLive()) return devStore.getCustomers();
  const page = await adminApi.get<Page<CustomerSummary>>('/admin/customers');
  return page.items;
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
  return adminApi.get<Page<CustomerSummary>>(
    `/admin/customers${buildQuery(opts)}`,
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
  const page = await adminApi.get<Page<ReviewItem>>('/admin/content-review');
  return pendingFirst(page.items);
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
