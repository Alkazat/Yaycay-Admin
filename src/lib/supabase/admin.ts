import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from '@/lib/config';

/*
 * Server-only Supabase admin client (service-role).
 *
 * The service-role key bypasses RLS, so this client MUST never be imported
 * into client components. It is the broad-access path used by the `admin`
 * role described in the model context (section 4). All reads/writes through
 * it are expected to be audited at the data-layer boundary.
 */

let client: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase admin client is not configured. Set ADMIN_SUPABASE_URL and ADMIN_SERVICE_ROLE_KEY.',
    );
  }
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}
