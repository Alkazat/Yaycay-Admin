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
  if (!isSupabaseConfigured()) return stubs.stubPrompts;
  return notWiredYet('listPrompts');
}

export async function listModelRoutes(): Promise<ModelRoute[]> {
  if (!isSupabaseConfigured()) return stubs.stubModelRoutes;
  return notWiredYet('listModelRoutes');
}

export async function listJobs(): Promise<AiJob[]> {
  if (!isSupabaseConfigured()) return stubs.stubJobs;
  return notWiredYet('listJobs');
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
  if (!isSupabaseConfigured()) return stubs.stubCustomers;
  return notWiredYet('listCustomers');
}
