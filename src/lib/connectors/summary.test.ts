import { describe, it, expect } from 'vitest';
import { daysSince, isStale, summariseConnectors } from './summary';
import type { AdminConnector } from '@/lib/contracts/types';

const NOW = '2026-06-14T00:00:00Z';

function connector(over: Partial<AdminConnector>): AdminConnector {
  return {
    id: 'g_1',
    userId: 'u_1',
    ownerEmail: 'a@example.com',
    assistant: 'Claude (claude.ai)',
    clientId: 'client_1',
    scopes: ['yaycay.read'],
    status: 'active',
    createdAt: '2026-05-01T00:00:00Z',
    lastUsedAt: '2026-06-13T00:00:00Z',
    ...over,
  };
}

describe('daysSince', () => {
  it('counts whole days, floored, and returns null for no timestamp', () => {
    expect(daysSince('2026-06-04T00:00:00Z', NOW)).toBe(10);
    expect(daysSince(null, NOW)).toBeNull();
  });
});

describe('isStale', () => {
  it('is true for an active connector never used', () => {
    expect(isStale(connector({ lastUsedAt: null }), NOW)).toBe(true);
  });

  it('is true for an active connector idle beyond the window', () => {
    expect(
      isStale(connector({ lastUsedAt: '2026-04-01T00:00:00Z' }), NOW),
    ).toBe(true);
  });

  it('is false when recently used, or when revoked', () => {
    expect(
      isStale(connector({ lastUsedAt: '2026-06-13T00:00:00Z' }), NOW),
    ).toBe(false);
    expect(
      isStale(connector({ status: 'revoked', lastUsedAt: null }), NOW),
    ).toBe(false);
  });
});

describe('summariseConnectors', () => {
  it('counts status, write scope, staleness and groups active by assistant', () => {
    const connectors: AdminConnector[] = [
      connector({
        id: 'g_1',
        assistant: 'Claude (claude.ai)',
        scopes: ['yaycay.read', 'yaycay.plan'],
      }),
      connector({
        id: 'g_2',
        assistant: 'Claude (claude.ai)',
        lastUsedAt: null,
      }),
      connector({ id: 'g_3', assistant: 'ChatGPT', scopes: ['yaycay.read'] }),
      connector({
        id: 'g_4',
        assistant: 'Gemini',
        status: 'revoked',
        lastUsedAt: null,
      }),
    ];
    const s = summariseConnectors(connectors, NOW);
    expect(s.total).toBe(4);
    expect(s.active).toBe(3);
    expect(s.revoked).toBe(1);
    expect(s.withPlanScope).toBe(1);
    // g_2 is active but never used -> stale; revoked g_4 does not count.
    expect(s.stale).toBe(1);
    expect(s.byAssistant).toEqual([
      { assistant: 'Claude (claude.ai)', count: 2 },
      { assistant: 'ChatGPT', count: 1 },
    ]);
  });
});
