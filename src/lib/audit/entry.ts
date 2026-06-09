import type { AuditEntry } from '@/lib/contracts/types';

/*
 * Pure audit-entry construction, free of Next.js / Supabase so it can be
 * unit-tested. The id and timestamp are injected (not read from globals) so
 * entries are deterministic in tests.
 */

export interface AuditInput {
  actor: string;
  action: string;
  target: string;
  details?: string;
}

export function buildAuditEntry(
  input: AuditInput,
  now: string,
  id: string,
): AuditEntry {
  return {
    id,
    actor: input.actor,
    action: input.action,
    target: input.target,
    at: now,
    details: input.details,
  };
}

/** Newest first, by timestamp then id (stable for equal timestamps). */
export function sortAudit(entries: AuditEntry[]): AuditEntry[] {
  return [...entries].sort(
    (a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id),
  );
}
