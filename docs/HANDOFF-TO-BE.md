# Handoff to Yaycay-BE: implement the admin-scoped contract (v0.2)

**From:** Yaycay-Admin thread. **Read `00-MODEL-CONTEXT.md` first.**

The Admin app scaffold is built and running on local stubs. It now needs the
real admin-scoped surface from BE, which owns the contract. This is a
request-for-change under model-context section 3: please implement the
`/admin/*` endpoints below, bump `@alkazat/contracts` to `0.2.0`, and publish.
Admin will then pin `^0.2.0`, delete its local type stand-ins, and wire its
data accessors.

The full spec (endpoint list in build order, DTOs, an OpenAPI 3.1 fragment,
acceptance criteria) is in `docs/be-contract-proposal-admin-v0.2.md`
(Yaycay-Admin PR #2). Summary below.

## Conventions

- Base path `/admin`. Off-domain, admin-scoped.
- Auth: Supabase JWT with `role=admin` AND AAL2 (verified MFA). Reject others
  with `403`.
- Every `/admin/*` call audited (actor, action, target, before/after on writes).
- Errors as problem+json (RFC 9457). Cursor pagination: `?cursor=&limit=` ->
  `{ items, nextCursor }`.

## Endpoints (build in this order)

1. **Prompts** (writes `prompts`): `GET /admin/prompts`,
   `GET /admin/prompts/{id}`, `POST /admin/prompts`,
   `POST /admin/prompts/{id}/versions`, `POST /admin/prompts/{id}/activate`,
   `GET /admin/prompts/{id}/diff?from=&to=`. Versions immutable; editing creates
   a new version; exactly one active version per task; `model` chosen per
   version.
2. **Models / routing**: `GET /admin/models`, `GET /admin/model-routes`,
   `PUT /admin/model-routes/{task}`. Default for use-our-AI is `claude-sonnet`.
3. **Jobs** (`ai_jobs`): `GET /admin/jobs` (filter `status,kind,tripId`),
   `GET /admin/jobs/{id}`, `POST /admin/jobs/{id}/retry`,
   `GET /admin/jobs/cap?tripId=` (cap ~10/day).
4. **Trips / customers** (read-only by default): `GET /admin/trips?query=`,
   `GET /admin/trips/{id}`, `GET /admin/trips/{id}/content` (canonical
   `trip_content`, section 5), `GET /admin/trips/{id}/profiles`,
   `GET /admin/trips/{id}/progress`, `GET /admin/customers?query=`,
   `POST /admin/customers/{id}/deletion-request`.
5. **Content review**: `GET /admin/content-review`,
   `POST /admin/content-review/{tripId}/approve`,
   `POST /admin/content-review/{tripId}/edit`.
6. **Commerce** (read-mostly, Stripe is source of truth):
   `GET /admin/products`, `GET /admin/purchases?query=`.

## DTOs (must match exactly so Admin and BE stay in sync)

```ts
type Role = 'user' | 'admin';
type TripTier = 'free' | 'byo' | 'ours';
type AiModel = 'claude-sonnet' | 'claude-opus' | 'gemini' | 'openai';
type AiJobKind = 'generation' | 'ingestion' | 'chat';
type AiJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

interface Prompt {
  id: string;
  task: string;
  title: string;
  body: string;
  model: AiModel;
  version: number;
  active: boolean;
  updatedAt: string;
  updatedBy: string;
}
interface ModelRoute {
  task: string;
  defaultModel: AiModel;
  override?: AiModel;
}
interface AiJob {
  id: string;
  tripId: string;
  kind: AiJobKind;
  status: AiJobStatus;
  model: AiModel;
  promptVersion: number;
  createdAt: string;
  error?: string;
}
interface TripSummary {
  id: string;
  destination: string;
  ownerEmail: string;
  tier: TripTier;
  status: string;
  startDate: string;
  endDate: string;
  retentionExpiresAt: string | null;
}
interface CustomerSummary {
  userId: string;
  email: string;
  tier: TripTier | null;
  retentionExpiresAt: string | null;
  deletionRequested: boolean;
}
interface ProductSummary {
  priceId: string;
  name: string;
  amountUsd: number;
}
// TripContent / TripDay / TripMoment / TripActivity per model-context section 5.
```

## Acceptance

- All `/admin/*` require `role=admin` + AAL2; non-admins get `403`. pgTAP/RLS
  proves no cross-account leakage.
- Prompt versions immutable; one active per task. `retry` re-enqueues and writes
  a new `ai_jobs` row; cap enforced.
- Contract bumped to `0.2.0` and published (GitHub Packages or tagged release).
  Reply to the Admin thread with the published version so it can pin `^0.2.0`.

## What we need back (for the Admin thread)

- The published `@alkazat/contracts@0.2.0` (types + `openapi.yaml`).
- Confirmation of the auth claim shape Admin should expect (`role` location in
  the JWT, AAL level).
- Any field renames vs the DTOs above, so Admin reconciles its stand-ins.
