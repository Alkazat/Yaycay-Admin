/*
 * Affiliate code + landing-slug generation. An influencer's discount /
 * attribution code is derived from their handle and discount (e.g.
 * "@SunnyTravels" at 15% -> "SUNNY15"), and their landing slug is the URL-safe
 * form used by the Website affiliate page (/go/<slug>). Pure and deterministic
 * so it is unit-tested; BE is the authority that registers the code with Stripe
 * and guarantees uniqueness.
 */

/** URL-safe slug from a handle: "@Sunny Travels!" -> "sunny-travels". */
export function slugifyHandle(handle: string): string {
  return handle
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** A discount code like "SUNNY15": alpha-numeric handle stem (<=8) + percent. */
export function suggestCode(handle: string, discountPercent: number): string {
  const stem = handle
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 8)
    .toUpperCase();
  const pct = Math.max(0, Math.round(discountPercent));
  return `${stem || 'YAYCAY'}${pct}`;
}

/** Landing slug for the Website affiliate page; never empty. */
export function suggestLandingSlug(handle: string): string {
  return slugifyHandle(handle) || 'partner';
}
