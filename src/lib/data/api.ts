import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { config } from '@/lib/config';

/*
 * Live admin API client for the BE `/admin/*` surface (@alkazat/contracts).
 *
 * Calls are authenticated with the signed-in admin's Supabase JWT (role=admin +
 * AAL2); BE enforces the rest. Used only when isAdminDataLive() (NEXT_PUBLIC_API_BASE
 * is set); otherwise the data layer serves stubs.
 */

async function adminToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    config.supabase.publicUrl,
    config.supabase.anonKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          /* read-only here */
        },
      },
    },
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Error from a live /admin/* call, carrying the HTTP status for diagnostics. */
export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly detail?: string,
  ) {
    super(`admin ${path} failed: ${status}${detail ? ` - ${detail}` : ''}`);
    this.name = 'AdminApiError';
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await adminToken();
  let res: Response;
  try {
    res = await fetch(`${config.apiBase}${path}`, {
      method,
      headers: {
        // Supabase Edge Functions gateway requires the anon apikey alongside
        // the admin JWT (per the BE handoff).
        ...(config.supabase.anonKey ? { apikey: config.supabase.anonKey } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (e) {
    // Network / DNS / TLS failure reaching the API base.
    throw new AdminApiError(
      0,
      path,
      e instanceof Error ? e.message : 'network error',
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AdminApiError(res.status, path, text.slice(0, 200));
  }
  return (await res.json()) as T;
}

export const adminApi = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
};

/** Standard `{ items, nextCursor }` page envelope from the admin lists. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
