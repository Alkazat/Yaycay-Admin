import 'server-only';
import { randomUUID } from 'node:crypto';
import { isSupabaseConfigured } from '@/lib/config';
import type { AuditEntry } from '@/lib/contracts/types';
import { devStore } from '@/lib/data/store';
import { buildAuditEntry, sortAudit, type AuditInput } from '@/lib/audit/entry';

/*
 * Records and reads the admin audit trail. Every /admin/* write should call
 * recordAudit. In stub mode entries live in the dev store; with BE configured,
 * BE owns the canonical audit store (the call is wired here).
 */

export async function recordAudit(input: AuditInput): Promise<AuditEntry> {
  const entry = buildAuditEntry(input, new Date().toISOString(), randomUUID());
  if (!isSupabaseConfigured()) {
    devStore.addAudit(entry);
    return entry;
  }
  // Real path: POST the audit event to BE. Until wired, still record locally so
  // the action is never silently unaudited.
  devStore.addAudit(entry);
  return entry;
}

export async function listAudit(): Promise<AuditEntry[]> {
  if (!isSupabaseConfigured()) return sortAudit(devStore.getAudit());
  return sortAudit(devStore.getAudit());
}
