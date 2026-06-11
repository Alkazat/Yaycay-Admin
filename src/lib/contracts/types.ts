/*
 * Local stub of the admin-scoped DTOs from @alkazat/contracts.
 *
 * BE owns the real contract; the Admin app consumes it as a pinned package.
 * Until that package is published and wired in, these types mirror the model
 * context (sections 4, 5, 7) so screens can be typed against a stable shape.
 *
 * Golden rule (model context section 3): never read a field that is not in
 * the contract. When the real package lands, replace this import surface with
 * `import type { ... } from '@alkazat/contracts'` and reconcile any drift.
 */

export type Role = 'user' | 'admin';
export type TripTier = 'free' | 'byo' | 'ours';
export type AiModel = 'claude-sonnet' | 'claude-opus' | 'gemini' | 'openai';
export type AiJobKind = 'generation' | 'ingestion' | 'chat';
export type AiJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type ActivityKind = 'kid' | 'shared' | 'adult';

export interface AdminSession {
  userId: string;
  email: string;
  role: Role;
  mfaVerified: boolean;
}

export interface Prompt {
  id: string;
  task: string; // e.g. "trip.generate", "ingest.reservation"
  title: string;
  body: string;
  model: AiModel;
  version: number;
  active: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface ModelRoute {
  task: string;
  defaultModel: AiModel;
  override?: AiModel;
}

export interface AiJob {
  id: string;
  tripId: string;
  kind: AiJobKind;
  status: AiJobStatus;
  model: AiModel;
  promptVersion: number;
  createdAt: string;
  error?: string;
}

export interface TripSummary {
  id: string;
  destination: string;
  ownerEmail: string;
  tier: TripTier;
  status: string;
  startDate: string;
  endDate: string;
  retentionExpiresAt: string | null;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  interests: string[];
}

/** The canonical content model (model context section 5), trimmed to admin needs. */
export interface TripContent {
  trip: {
    id: string;
    destination: string;
    start_date: string;
    end_date: string;
    timezone: string;
    currency: string;
  };
  days: TripDay[];
  grownups?: { essentials?: string; checklist?: string[]; transport?: string };
}

export interface TripDay {
  id: string;
  date: string;
  label: string;
  summary?: string;
  moments: TripMoment[];
}

export interface TripMoment {
  id: string;
  slot: string;
  title: string;
  time_hint?: string;
  activities: TripActivity[];
}

export interface TripActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  body?: string;
}

export interface ProductSummary {
  priceId: string;
  name: string;
  amountUsd: number;
  tier?: TripTier;
}

/** A purchase / entitlement row (contract: PurchaseSummary). Stripe is the
 * source of truth; this is the read view from the Stripe webhook. */
export interface Purchase {
  id: string;
  ownerEmail: string;
  priceId: string;
  tier: TripTier | null;
  amountUsd: number;
  createdAt: string;
}

export interface CustomerSummary {
  userId: string;
  email: string;
  tier: TripTier | null;
  retentionExpiresAt: string | null;
  deletionRequested: boolean;
}

/**
 * Audit record for an admin action. The security posture requires every
 * /admin/* write to be audited (actor, action, target, when). BE owns the
 * canonical audit store; Admin records and displays it.
 */
export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  details?: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'edited';

/**
 * AI-generated content awaiting the quality bar before it reaches a family
 * (contract: ContentReviewItem). From `pending` an admin either approves it as
 * is, or edits-then-publishes (terminal `edited`).
 */
export interface ReviewItem {
  tripId: string;
  destination: string;
  status: ReviewStatus;
  generatedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

/** Daily-cap usage for a trip (contract: JobCapUsage). */
export interface JobCapUsage {
  tripId: string;
  date: string;
  used: number;
  limit: number;
  remaining: number;
}
