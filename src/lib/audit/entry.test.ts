import { describe, it, expect } from 'vitest';
import { buildAuditEntry, sortAudit } from './entry';
import type { AuditEntry } from '@/lib/contracts/types';

describe('buildAuditEntry', () => {
  it('injects id and timestamp and keeps the input fields', () => {
    const entry = buildAuditEntry(
      { actor: 'a@yaycay.ai', action: 'prompt.activate', target: 'gen@v2' },
      '2026-06-08T10:00:00Z',
      'aud_1',
    );
    expect(entry).toEqual({
      id: 'aud_1',
      actor: 'a@yaycay.ai',
      action: 'prompt.activate',
      target: 'gen@v2',
      at: '2026-06-08T10:00:00Z',
      details: undefined,
    });
  });
});

describe('sortAudit', () => {
  it('orders newest first without mutating the input', () => {
    const entries: AuditEntry[] = [
      {
        id: 'a',
        actor: 'x',
        action: 'y',
        target: 'z',
        at: '2026-06-01T00:00:00Z',
      },
      {
        id: 'b',
        actor: 'x',
        action: 'y',
        target: 'z',
        at: '2026-06-08T00:00:00Z',
      },
    ];
    const sorted = sortAudit(entries);
    expect(sorted.map((e) => e.id)).toEqual(['b', 'a']);
    expect(entries.map((e) => e.id)).toEqual(['a', 'b']);
  });
});
