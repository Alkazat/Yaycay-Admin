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
