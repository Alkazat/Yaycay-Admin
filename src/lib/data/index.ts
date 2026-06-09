import 'server-only';
import { isSupabaseConfigured } from '@/lib/config';
import type {
  AiJob,
  CustomerSummary,
  ModelRoute,
  ProductSummary,
  Prompt,
  TripContent,
  TripSummary,
} from '@/lib/contracts/types';
import * as stubs from '@/lib/data/stubs';
import { devStore } from '@/lib/data/store';
import {
  buildNewVersion,
  withActivated,
  type NewVersionInput,
} from '@/lib/prompts/versioning';

/*
 * The admin data layer.
 *
 * Each accessor returns contract-shaped data. When Supabase / BE are not
 * configured, it serves local fixtures so the UI is fully navigable in dev.
 * When configured, the real query belongs here (admin Supabase client or the
 * BE /admin/* endpoints) - this is the single place to wire it, and the single
 * place to attach audit logging for every admin read/write.
 */

function notWiredYet(resource: string): never {
  throw new Error(
    `Data accessor for "${resource}" is not wired to Supabase/BE yet. ` +
      'Implement the real query in src/lib/data, or run with stubs (unset Supabase env).',
  );
}

export async function listPrompts(): Promise<Prompt[]> {
  if (!isSupabaseConfigured()) return devStore.getPrompts();
  return notWiredYet('listPrompts');
}

/**
 * Create a new immutable version for a task (inactive until activated). In stub
 * mode this writes to the dev store; with BE configured this is the
 * POST /admin/prompts/{id}/versions call.
 */
export async function createPromptVersion(
  input: NewVersionInput,
): Promise<Prompt> {
  if (!isSupabaseConfigured()) {
    const created = buildNewVersion(devStore.getPrompts(), input);
    devStore.addPrompt(created);
    return created;
  }
  return notWiredYet('createPromptVersion');
}

/** Activate a version, deactivating its siblings (POST /admin/prompts/{id}/activate). */
export async function activatePrompt(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    devStore.replacePrompts(withActivated(devStore.getPrompts(), id));
    return;
  }
  return notWiredYet('activatePrompt');
}

export async function listModelRoutes(): Promise<ModelRoute[]> {
  if (!isSupabaseConfigured()) return devStore.getModelRoutes();
  return notWiredYet('listModelRoutes');
}

export async function listJobs(): Promise<AiJob[]> {
  if (!isSupabaseConfigured()) return devStore.getJobs();
  return notWiredYet('listJobs');
}

/**
 * Retry a failed job. Per the v0.2 contract, this re-enqueues by writing a new
 * ai_jobs row (queued), leaving the failed row as history. In stub mode this
 * writes to the dev store; with BE configured this is POST /admin/jobs/{id}/retry.
 */
export async function retryJob(id: string): Promise<AiJob | null> {
  if (!isSupabaseConfigured()) {
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
  return notWiredYet('retryJob');
}

export async function listTrips(): Promise<TripSummary[]> {
  if (!isSupabaseConfigured()) return stubs.stubTrips;
  return notWiredYet('listTrips');
}

export async function getTripContent(
  tripId: string,
): Promise<TripContent | null> {
  if (!isSupabaseConfigured()) return stubs.stubTripContent[tripId] ?? null;
  return notWiredYet('getTripContent');
}

export async function listProducts(): Promise<ProductSummary[]> {
  if (!isSupabaseConfigured()) return stubs.stubProducts;
  return notWiredYet('listProducts');
}

export async function listCustomers(): Promise<CustomerSummary[]> {
  if (!isSupabaseConfigured()) return devStore.getCustomers();
  return notWiredYet('listCustomers');
}

/**
 * Record a data-deletion request for a customer (POST
 * /admin/customers/{id}/deletion-request). The actual disposal runs server-side
 * per the retention policy; this flags the intent and is audited by the caller.
 */
export async function requestCustomerDeletion(
  userId: string,
): Promise<CustomerSummary | null> {
  if (!isSupabaseConfigured()) {
    return devStore.setDeletionRequested(userId, true) ?? null;
  }
  return notWiredYet('requestCustomerDeletion');
}
