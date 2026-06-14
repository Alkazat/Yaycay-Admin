import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth/session';
import { config, missingRequiredEnv } from '@/lib/config';
import { AppShell } from '@/components/AppShell';
import { ConfigError } from '@/components/ConfigError';

/*
 * Layout for every admin screen. requireAdmin() runs server-side on each
 * request and redirects unless the caller is an authenticated admin with
 * verified MFA. No customer ever reaches past this boundary.
 *
 * Before that, a deployment missing its required env renders a readable config
 * screen instead of a 500 (the auth/data clients throw on empty credentials).
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const missing = missingRequiredEnv();
  if (!config.devBypass && missing.length > 0) {
    return <ConfigError missing={missing} />;
  }

  const session = await requireAdmin();
  return <AppShell session={session}>{children}</AppShell>;
}
