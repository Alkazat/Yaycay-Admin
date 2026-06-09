import { describe, it, expect } from 'vitest';
import { evaluateAccess, isAdminAuthorized } from './guard';
import type { AdminSession } from '@/lib/contracts/types';

const admin: AdminSession = {
  userId: 'u_1',
  email: 'admin@yaycay.ai',
  role: 'admin',
  mfaVerified: true,
};

describe('evaluateAccess', () => {
  it('allows an authenticated admin with verified MFA', () => {
    expect(evaluateAccess(admin)).toEqual({ allowed: true });
    expect(isAdminAuthorized(admin)).toBe(true);
  });

  it('refuses when there is no session', () => {
    expect(evaluateAccess(null)).toEqual({
      allowed: false,
      reason: 'unauthenticated',
    });
  });

  it('refuses a non-admin user', () => {
    const decision = evaluateAccess({ ...admin, role: 'user' });
    expect(decision).toEqual({ allowed: false, reason: 'not-admin' });
  });

  it('refuses an admin who has not cleared MFA', () => {
    const decision = evaluateAccess({ ...admin, mfaVerified: false });
    expect(decision).toEqual({ allowed: false, reason: 'mfa-required' });
  });
});
