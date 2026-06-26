'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { createTrip, deleteTrip } from '@/lib/data';
import { recordAudit } from '@/lib/audit';
import type { TripTier } from '@/lib/contracts/types';

/** Query string for a failed write: the HTTP status + a trimmed BE detail. */
function failQuery(status: number, detail: string): string {
  const d = detail ? `&detail=${encodeURIComponent(detail.slice(0, 180))}` : '';
  return `notice=backend&status=${status}${d}`;
}

/**
 * Admin-create a trip for a user with no paywall. BE assigns the trip + tier
 * entitlement directly, skipping the Stripe purchase path. Audited.
 */
export async function createTripAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const ownerEmail = String(formData.get('ownerEmail') ?? '')
    .trim()
    .toLowerCase();
  const destination = String(formData.get('destination') ?? '').trim();
  const tier = String(formData.get('tier') ?? 'ours') as TripTier;
  const startDate = String(formData.get('startDate') ?? '').trim();
  const endDate = String(formData.get('endDate') ?? '').trim();
  if (!ownerEmail || !destination || !startDate || !endDate) return;

  const result = await createTrip({
    ownerEmail,
    destination,
    tier,
    startDate,
    endDate,
  });
  if (!result.ok) {
    redirect(`/trips?${failQuery(result.status, result.detail)}`);
  }
  await recordAudit({
    actor: session.email,
    action: 'trip.create',
    target: result.value.id,
    details: `${destination} for ${ownerEmail} (${tier})`,
  });
  revalidatePath('/trips');
  redirect(`/trips?notice=tripcreated&q=${encodeURIComponent(ownerEmail)}`);
}

/** Delete a trip. Audited. */
export async function deleteTripAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const tripId = String(formData.get('tripId') ?? '');
  if (!tripId) return;

  const result = await deleteTrip(tripId);
  if (!result.ok) {
    redirect(`/trips?${failQuery(result.status, result.detail)}`);
  }
  await recordAudit({
    actor: session.email,
    action: 'trip.delete',
    target: tripId,
  });
  revalidatePath('/trips');
  redirect('/trips?notice=tripdeleted');
}
