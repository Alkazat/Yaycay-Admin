import { describe, it, expect } from 'vitest';
import { personaFor, personaLabel } from './personas';

describe('personaFor', () => {
  it('maps every known mode to a persona', () => {
    expect(personaFor('little')?.label).toBe('Little Explorer');
    expect(personaFor('explorer')?.label).toBe('Explorer');
    expect(personaFor('explorer_plus')?.label).toBe('Big Explorer');
    expect(personaFor('standard')?.label).toBe('Grown Ups');
  });

  it('returns null for an absent or unknown mode', () => {
    expect(personaFor(null)).toBeNull();
    expect(personaFor(undefined)).toBeNull();
    expect(personaFor('wizard')).toBeNull();
  });
});

describe('personaLabel', () => {
  it('renders emoji + label for a known mode', () => {
    expect(personaLabel('explorer_plus')).toBe('🚀 Big Explorer');
  });

  it('falls back to the raw mode for an unknown value', () => {
    expect(personaLabel('wizard')).toBe('wizard');
  });

  it('returns null when there is no mode', () => {
    expect(personaLabel(null)).toBeNull();
  });
});
