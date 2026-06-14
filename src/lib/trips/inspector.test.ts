import { describe, it, expect } from 'vitest';
import { presentVariantModes, profileSafety } from './inspector';
import type { ChildProfile } from '@/lib/contracts/types';

describe('presentVariantModes', () => {
  it('returns present modes in a stable order', () => {
    expect(
      presentVariantModes({
        explorer_plus: { fact: 'x' },
        standard: { body: 'y' },
      }),
    ).toEqual(['standard', 'explorer_plus']);
  });

  it('is empty for no variants', () => {
    expect(presentVariantModes()).toEqual([]);
    expect(presentVariantModes({})).toEqual([]);
  });
});

describe('profileSafety', () => {
  const base: ChildProfile = {
    id: 'p1',
    name: 'Lenny',
    type: 'child',
    pin_set: false,
    interests: [],
    dietary: [],
    medical: [],
    created_at: '2026-05-01T09:00:00Z',
    updated_at: '2026-05-01T09:00:00Z',
  };

  it('flags dietary and medical entries', () => {
    const out = profileSafety({
      ...base,
      dietary: ['nuts'],
      medical: ['anaphylaxis'],
    });
    expect(out).toEqual({
      dietary: ['nuts'],
      medical: ['anaphylaxis'],
      hasAny: true,
    });
  });

  it('reports hasAny false when there are no flags', () => {
    expect(profileSafety(base).hasAny).toBe(false);
  });
});
