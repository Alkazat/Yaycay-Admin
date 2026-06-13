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

import type { ActivityKind, Challenge, TripTier, Variants } from '@alkazat/contracts';

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
  // Names the Admin app uses that the contract publishes under a different name.
  ContentReviewItem as ReviewItem,
  ContentReviewStatus as ReviewStatus,
  PurchaseSummary as Purchase,
} from '@alkazat/contracts';

// ---------------------------------------------------------------------------
// Retained locally: Admin diverges from contract v0.8.
// ---------------------------------------------------------------------------

/**
 * Admin's child-profile view carries an explorer `mode`, `dietary` flags and an
 * optional `age` that the published `ChildProfile` (age required, no mode) does
 * not. Kept local until the contract gains the admin-inspection fields.
 */
export interface ChildProfile {
  id: string;
  name: string;
  age?: number;
  mode?: 'little' | 'standard' | 'explorer' | 'explorer_plus';
  interests: string[];
  /** Additive (FE roadmap section D): safety flags surfaced to admins. */
  dietary?: string[];
  medical?: string[];
}

/** Per-profile progress (contract: AdminProgress). Not yet in the package. */
export interface AdminProgress {
  profileId: string | null;
  activeMode: string | null;
  doneItems: string[];
}

/**
 * The catalogue row as the Admin console lists it. The published
 * `ProductSummary` additionally requires `kind` and `active`; Admin reads only
 * the trimmed set here, so it stays local until those are surfaced in the UI.
 */
export interface ProductSummary {
  priceId: string;
  name: string;
  amountUsd: number;
  tier?: TripTier;
  /** Stripe mode (additive). true = live, false = test/sandbox. Undefined when
   * BE does not yet send it. Surfaced as a Live/Test badge in Commerce. */
  livemode?: boolean;
}

/* --------------------------------------------------------------------------
 * Content model (model context section 5), trimmed to admin needs.
 *
 * Admin renders a simplified view of the trip content: weather as
 * `{ summary, high_c, low_c }`, a hotel `move` flag, a `{ title, stars }` star
 * challenge. The published content model (`Day`/`Weather`/`Hotel`/...) carries
 * different shapes, so these stay local; full adoption is a BE-side
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
  hotel?: DayHotel;
  game?: DayGame;
  star_challenge?: StarChallenge;
}

export interface Weather {
  summary: string;
  high_c?: number;
  low_c?: number;
}

export interface DayHotel {
  name: string;
  /** True when the family changes accommodation on this day. */
  move?: boolean;
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
