import type { AdminSession } from '@/lib/contracts/types';

/*
 * Pure access-control logic, kept free of Next.js / Supabase so it can be
 * unit-tested directly. Both the middleware and server components route every
 * decision through evaluateAccess(): admin role AND verified MFA are required.
 */

export type AccessDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: 'unauthenticated' | 'not-admin' | 'mfa-required';
    };

export function evaluateAccess(session: AdminSession | null): AccessDecision {
  if (!session) {
    return { allowed: false, reason: 'unauthenticated' };
  }
  if (session.role !== 'admin') {
    return { allowed: false, reason: 'not-admin' };
  }
  if (!session.mfaVerified) {
    return { allowed: false, reason: 'mfa-required' };
  }
  return { allowed: true };
}

/** Convenience predicate for guards and tests. */
export function isAdminAuthorized(session: AdminSession | null): boolean {
  return evaluateAccess(session).allowed;
}
