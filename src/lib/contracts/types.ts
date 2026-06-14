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
 * An admin account row for the admin-management screen. Promoting admins is a
 * BE concern (role lives in `identity.accounts`); the endpoints are not in the
 * contract yet - tracked in the BE verification checklist.
 */
export interface AdminAccount {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

/* --------------------------------------------------------------------------
 * Pending contract: affiliate / influencer program.
 *
 * Admin owns the operator surface for the influencer program (create a code,
 * see attributed revenue, send a monthly report). The DTOs below are local
 * stand-ins until BE adds them to @alkazat/contracts - see
 * docs/HANDOFF-affiliate-program-BE.md for the endpoints + Stripe coupon and
 * attribution work this depends on. Same precedent as AdminAccount above.
 * ------------------------------------------------------------------------ */

export type AffiliateStatus = 'active' | 'paused';

/** An influencer in the affiliate program. */
export interface Affiliate {
  id: string;
  /** Influencer's name (shown on the report). */
  name: string;
  /** Where the monthly report is emailed. */
  email: string;
  /** Social handle, e.g. "@sunnytravels". */
  handle: string;
  /** Discount + attribution code a customer enters at checkout, e.g. "SUNNY15". */
  code: string;
  /** Customer-facing discount the code applies, as a percentage. */
  discountPercent: number;
  /** What we pay the influencer on net revenue, as a percentage. */
  commissionPercent: number;
  /** URL-safe slug for the Website affiliate landing page (/go/<slug>). */
  landingSlug: string;
  status: AffiliateStatus;
  createdAt: string;
}

/** Request body for creating an affiliate (code + slug are derived server-side). */
export interface CreateAffiliateInput {
  name: string;
  email: string;
  handle: string;
  discountPercent: number;
  commissionPercent: number;
}

/** A single purchase attributed to an affiliate code (from the Stripe webhook). */
export interface AffiliateRedemption {
  purchaseId: string;
  ownerEmail: string;
  priceId: string;
  /** List price before the discount. */
  grossUsd: number;
  /** Discount the code applied. */
  discountUsd: number;
  /** What the customer actually paid (gross - discount). */
  netUsd: number;
  createdAt: string;
}

/** A period summary of an affiliate's revenue and the commission we owe them. */
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
 * Pending contract: BYO-AI MCP connectors (admin/ops view).
 *
 * The FE ships an OAuth-protected MCP server; a parent connects their own AI
 * (Claude / ChatGPT / Gemini) and it plans trips through the contract on their
 * behalf. Admin owns the cross-account ops view: see who connected what, and
 * revoke. DTOs are local stand-ins until BE adds an admin-scoped read + revoke
 * to @alkazat/contracts - see docs/HANDOFF-connectors-admin-BE.md.
 * ------------------------------------------------------------------------ */

export type ConnectorScope = 'yaycay.read' | 'yaycay.plan';
export type ConnectorStatus = 'active' | 'revoked';

/** One connected assistant (an OAuth grant) as surfaced to admin ops. */
export interface AdminConnector {
  /** Grant id, used to revoke. */
  id: string;
  /** Owning account. */
  userId: string;
  ownerEmail: string;
  /** Human label for the assistant / OAuth client, e.g. "Claude (claude.ai)". */
  assistant: string;
  /** OAuth client id that registered (RFC 7591 dynamic registration). */
  clientId: string;
  scopes: ConnectorScope[];
  status: ConnectorStatus;
  createdAt: string;
  /** Last time a tool call used this grant; null if never. */
  lastUsedAt: string | null;
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
