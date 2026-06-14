/* Central, typed access to environment configuration. */

export const config = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  supabase: {
    url: process.env.ADMIN_SUPABASE_URL ?? '',
    serviceRoleKey: process.env.ADMIN_SERVICE_ROLE_KEY ?? '',
    publicUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  /** Dev-only stub bypass. Never true outside local development. */
  devBypass:
    process.env.ADMIN_DEV_BYPASS === 'true' &&
    process.env.NODE_ENV !== 'production',
} as const;

/** True when a real Supabase admin connection is configured. */
export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
}

/**
 * True when the admin DATA source (BE /admin/* endpoints) is configured.
 *
 * This is deliberately separate from auth: Supabase can be configured for
 * sign-in while the BE data API is not built yet. Until NEXT_PUBLIC_API_BASE
 * is set, the data layer serves local stubs so the screens work, even though
 * sign-in is real.
 */
export function isAdminDataLive(): boolean {
  return Boolean(config.apiBase);
}

/**
 * Public Supabase env required for the browser + SSR sign-in flow. When these
 * are missing the auth client (`createServerClient`/`createBrowserClient`)
 * throws at construction, which SSR turns into a 500. Callers guard on this
 * first so a missing config degrades to a readable screen, not a crash.
 */
export function missingPublicSupabaseEnv(): string[] {
  const missing: string[] = [];
  if (!config.supabase.publicUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!config.supabase.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return missing;
}

/**
 * Every Supabase env a deployed admin server needs: the public auth values plus
 * the server-only service-role pair the data layer uses.
 */
export function missingRequiredEnv(): string[] {
  const missing = missingPublicSupabaseEnv();
  if (!config.supabase.url) missing.push('ADMIN_SUPABASE_URL');
  if (!config.supabase.serviceRoleKey) missing.push('ADMIN_SERVICE_ROLE_KEY');
  return missing;
}
