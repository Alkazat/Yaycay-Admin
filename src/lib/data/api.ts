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

async function request<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await adminToken();
  const res = await fetch(`${config.apiBase}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`admin ${method} ${path} failed: ${res.status}`);
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
