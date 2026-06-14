import { describe, it, expect } from 'vitest';
import { slugifyHandle, suggestCode, suggestLandingSlug } from './code';

describe('slugifyHandle', () => {
  it('strips the @ and lowercases, hyphenating non-alphanumerics', () => {
    expect(slugifyHandle('@Sunny Travels!')).toBe('sunny-travels');
  });

  it('trims leading and trailing separators', () => {
    expect(slugifyHandle('  @dad.on.tour  ')).toBe('dad-on-tour');
  });
});

describe('suggestCode', () => {
  it('builds an uppercased stem capped at 8 chars plus the rounded percent', () => {
    expect(suggestCode('@sunnytravels', 15)).toBe('SUNNYTRA15');
    expect(suggestCode('@dadontour', 10)).toBe('DADONTOU10');
  });

  it('falls back to a brand stem when the handle has no usable characters', () => {
    expect(suggestCode('@___', 20)).toBe('YAYCAY20');
  });
});

describe('suggestLandingSlug', () => {
  it('mirrors the handle slug and never returns empty', () => {
    expect(suggestLandingSlug('@sunnytravels')).toBe('sunnytravels');
    expect(suggestLandingSlug('@!!!')).toBe('partner');
  });
});
