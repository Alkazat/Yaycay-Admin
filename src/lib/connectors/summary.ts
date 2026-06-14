import type { AdminConnector } from '@/lib/contracts/types';

/*
 * Pure roll-up for the Connected assistants screen, free of React so it is
 * unit-tested. Answers the ops questions: how many assistants are connected,
 * how many can write (yaycay.plan), and which are stale (active but unused) so
 * they can be pruned. Mirrors the affiliate report helper's shape.
 */

/** An active connector unused for this many days counts as stale. */
export const STALE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ConnectorSummary {
  total: number;
  active: number;
  revoked: number;
  /** Active connectors holding the write scope (yaycay.plan). */
  withPlanScope: number;
  /** Active connectors that are stale (never used, or idle > STALE_DAYS). */
  stale: number;
  /** Active connector counts per assistant, busiest first. */
  byAssistant: { assistant: string; count: number }[];
}

/** Whole days between an ISO timestamp and `now` (>= 0), or null if absent. */
export function daysSince(iso: string | null, now: string): number | null {
  if (!iso) return null;
  const delta = new Date(now).getTime() - new Date(iso).getTime();
  return Math.max(0, Math.floor(delta / DAY_MS));
}

/** An active connector is stale if never used, or idle beyond STALE_DAYS. */
export function isStale(
  connector: AdminConnector,
  now: string,
  staleDays: number = STALE_DAYS,
): boolean {
  if (connector.status !== 'active') return false;
  const idle = daysSince(connector.lastUsedAt, now);
  return idle === null || idle > staleDays;
}

export function summariseConnectors(
  connectors: AdminConnector[],
  now: string,
): ConnectorSummary {
  const active = connectors.filter((c) => c.status === 'active');
  const counts = new Map<string, number>();
  for (const c of active) {
    counts.set(c.assistant, (counts.get(c.assistant) ?? 0) + 1);
  }
  return {
    total: connectors.length,
    active: active.length,
    revoked: connectors.filter((c) => c.status === 'revoked').length,
    withPlanScope: active.filter((c) => c.scopes.includes('yaycay.plan'))
      .length,
    stale: active.filter((c) => isStale(c, now)).length,
    byAssistant: [...counts.entries()]
      .map(([assistant, count]) => ({ assistant, count }))
      .sort(
        (a, b) => b.count - a.count || a.assistant.localeCompare(b.assistant),
      ),
  };
}
