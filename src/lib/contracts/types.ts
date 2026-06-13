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
  Challenge,
  ChildProfile,
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
