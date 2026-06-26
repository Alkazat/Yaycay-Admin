/*
 * @alkazat/contracts adoption barrel for the Admin app.
 *
 * BE owns the contract; Admin now consumes it as a pinned package
 * (@alkazat/contracts@^0.8.0). The admin-scoped and shared DTOs that match the
 * published shapes are re-exported straight from the package below, so there is
 * one source of truth.
 *
 * The remaining declarations are kept local on purpose: Admin's shapes here
 * genuinely diverge from contract v0.8, so re-exporting the published versions
 * would not type-check. Each retained block notes why; reconciling the drift is
 * a BE contract change (model context section 3), not a local invention.
 */

import type {
  ActivityKind,
  AdminTripSummary,
  Challenge,
  ChildProfile,
  CustomerSummary,
  Hotel,
  ProductSummary,
  TripTier,
  Variants,
  Weather,
} from '@alkazat/contracts';

// ---------------------------------------------------------------------------
// Re-exported verbatim from the published contract (drop-in matches).
// ---------------------------------------------------------------------------
export type {
  Role,
  TripTier,
  AiModel,
  AiJobKind,
  AiJobStatus,
  ActivityKind,
  AdminSession,
  AdminAccount,
  AdminPromoteRequest,
  Prompt,
  ModelRoute,
  AiJob,
  AdminTripSummary,
  AuditEntry,
  CustomerSummary,
  JobCapUsage,
  Variants,
  VariantBlock,
  Challenge,
  ChildProfile,
  Weather,
  Hotel,
  ProductSummary,
  ProductKind,
  CreateProductRequest,
  UpdateProductRequest,
  // Affiliate / influencer program (contract v0.16+, adopted at ^0.27.0).
  AffiliateStatus,
  Affiliate,
  CreateAffiliateInput,
  UpdateAffiliateInput,
  AffiliateRedemption,
  AffiliateReportRequest,
  AffiliatePage,
  AffiliateRedemptionPage,
  // BYO-AI MCP connectors, admin/ops view (contract v0.16+, adopted at ^0.27.0).
  ConnectorScope,
  AdminConnector,
  AdminConnectorPage,
  // Manual customer invite (contract v0.33).
  InviteCustomerInput,
  // Names the Admin app uses that the contract publishes under a different name.
  ContentReviewItem as ReviewItem,
  ContentReviewStatus as ReviewStatus,
  PurchaseSummary as Purchase,
} from '@alkazat/contracts';

// ---------------------------------------------------------------------------
// Retained locally: Admin diverges from contract v0.8.
// ---------------------------------------------------------------------------

/** Per-profile progress (contract: AdminProgress). Not yet in the package. */
export interface AdminProgress {
  profileId: string | null;
  activeMode: string | null;
  doneItems: string[];
}

/**
 * Account lifecycle as Admin sees it. `invited` = magic-link sent, not yet
 * signed in; `active` = has signed in; `deletion-requested` = a GDPR deletion
 * is pending execution.
 */
export type AdminUserStatus = 'active' | 'invited' | 'deletion-requested';

/**
 * Admin VIEW-MODEL for the live Users table: the thin contract `CustomerSummary`
 * enriched with the operational columns an administrator needs at a glance.
 *
 * Local on purpose: the published `CustomerSummary` is `{ userId, email, tier,
 * retentionExpiresAt, deletionRequested }` only. The extra fields below
 * (status, createdAt, lastLoginAt, explorerCount, grownupCount, tripCount) are
 * NOT in the contract yet - BE needs to add them (or a richer `GET /admin/users`)
 * before they populate live; until then live rows show them as null/0 and the
 * dev store fills them so the workflow is testable. See
 * docs/HANDOFF-admin-user-management-BE.md.
 */
export interface AdminUserRow extends CustomerSummary {
  status: AdminUserStatus;
  /** Account creation - "user since". */
  createdAt: string | null;
  /** Last successful sign-in. */
  lastLoginAt: string | null;
  /** Child profiles on the account ("explorers"). */
  explorerCount: number;
  /** Adult travellers on the account ("grownups"). */
  grownupCount: number;
  /** Trips owned by the user (derived from the trips list). */
  tripCount: number;
}

/**
 * One row of the data-deletion queue (GET /admin/deletion-requests): the BE
 * computes the footprint + grace eligibility. Local until the contract package
 * publishes a DeletionRequest DTO.
 */
export interface DeletionRequestItem {
  userId: string;
  email: string;
  requestedAt: string;
  /** Whole days since the request was raised. */
  ageDays: number;
  /** When the 30-day grace elapses and a non-forced execute is allowed. */
  eligibleAt: string;
  eligible: boolean;
  tier: string | null;
  trips: number;
  media: number;
  purchases: number;
}

/** Pending contract: change a user's email (PATCH /admin/customers/{id}/email). */
export interface UpdateCustomerEmailInput {
  email: string;
}

/**
 * Pending contract: admin-create a trip for a user with no paywall
 * (POST /admin/trips). BE assigns the trip + tier entitlement directly, skipping
 * the Stripe purchase path. Local stand-in - see the handoff doc.
 */
export interface CreateTripInput {
  ownerEmail: string;
  destination: string;
  tier: TripTier;
  startDate: string;
  endDate: string;
}

/**
 * A period summary of an affiliate's revenue and the commission we owe them.
 *
 * Retained locally on purpose: this is an Admin-computed VIEW-MODEL (built by
 * `src/lib/affiliates/report.ts` to render the on-screen totals and the email
 * preview), not a BE DTO. The affiliate DTOs themselves (Affiliate,
 * CreateAffiliateInput, AffiliateRedemption, the *Page envelopes,
 * AffiliateReportRequest) now come from @alkazat/contracts; BE owns the actual
 * report send via Brevo (POST /admin/affiliates/{code}/report).
 */
export interface AffiliateReport {
  affiliateCode: string;
  influencer: string;
  /** Inclusive ISO start date of the period. */
  periodStart: string;
  /** Exclusive ISO end date of the period. */
  periodEnd: string;
  redemptions: number;
  grossRevenueUsd: number;
  discountGivenUsd: number;
  netRevenueUsd: number;
  commissionOwedUsd: number;
  currency: 'USD';
}

/* --------------------------------------------------------------------------
 * Pending contract: admin support sessions ("view-as").
 *
 * A support session is a time-boxed, reason-gated, audited record of an admin
 * inspecting ONE customer's data. It is an OVERSIGHT record, not a credential:
 * no customer login link, access/refresh token, or auth cookie is ever issued.
 * The admin inspects data through the AAL2-gated /admin/support-sessions/*
 * surface; the session scopes, logs, time-boxes, and surfaces that access.
 * Acting AS the customer (writes) is out of scope by design.
 *
 * BE owns the surface; these shapes mirror @alkazat/contracts and are kept
 * local until the package republishes (same precedent as AdminAccount).
 * ------------------------------------------------------------------------ */

export type SupportSessionMode = 'read_only';
export type SupportSessionEndReason = 'manual' | 'expired';

export interface SupportSession {
  id: string;
  /** The admin who opened the session. */
  actorId: string;
  actorEmail: string | null;
  /** The customer being inspected. */
  targetUserId: string;
  targetEmail: string | null;
  /** Mandatory justification (e.g. a ticket reference); audited. */
  reason: string;
  mode: SupportSessionMode;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  endedReason: SupportSessionEndReason | null;
  /** Derived server-side: not ended and not past expiresAt. */
  active: boolean;
}

/** Body for opening a session. One of targetUserId / targetEmail is required. */
export interface StartSupportSessionInput {
  targetUserId?: string;
  targetEmail?: string;
  reason: string;
  /** Clamped server-side (default 30, max 120). */
  ttlMinutes?: number;
}

/** A child / parent-carer profile as surfaced in a support snapshot. */
export interface SupportProfile {
  id: string;
  name: string;
  age: number;
  type: string;
  pin_set: boolean;
  interests: string[];
  /** Medical/dietary flags surfaced to adults as safety callouts. */
  medical?: string[];
}

/** Read-only customer footprint returned for an active support session. */
export interface SupportSessionSnapshot {
  session: SupportSession;
  customer: CustomerSummary;
  profiles: SupportProfile[];
  trips: AdminTripSummary[];
}

/* --------------------------------------------------------------------------
 * Content model (model context section 5), trimmed to admin needs.
 *
 * `weather` and `hotel` now adopt the published contract `Weather`/`Hotel`
 * shapes. The day/moment/game/star-challenge wrappers stay local; full
 * adoption of the contract `Day` (and `Game`/`StarChallenge`) is a BE-side
 * reconciliation tracked separately.
 * ------------------------------------------------------------------------ */

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
  /** Additive content enrichment (FE roadmap section D). */
  did_you_know?: string;
  weather?: Weather;
  hotel?: Hotel;
  game?: DayGame;
  star_challenge?: StarChallenge;
}

export interface DayGame {
  kind: string;
  title: string;
}

export interface StarChallenge {
  title: string;
  stars: number;
}

export interface TripMoment {
  id: string;
  slot: string;
  title: string;
  time_hint?: string;
  location?: Location;
  activities: TripActivity[];
}

export interface Location {
  name: string;
  lat?: number;
  lng?: number;
  zoom?: number;
}

export interface TripActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  body?: string;
  /** Additive content enrichment (FE roadmap section D). */
  facts?: string[];
  challenge?: Challenge;
  variants?: Variants;
  safety?: { note?: string; flags?: string[] };
  booking?: { name: string; time?: string };
}
