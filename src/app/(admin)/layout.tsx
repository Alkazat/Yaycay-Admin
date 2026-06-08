import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';

/*
 * Layout for every admin screen. requireAdmin() runs server-side on each
 * request and redirects unless the caller is an authenticated admin with
 * verified MFA. No customer ever reaches past this boundary.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();
  return <AppShell session={session}>{children}</AppShell>;
}
