# Contract change request: admin-scoped surface (target `@yaycay/contracts` v0.2)

> **Status:** proposal, authored by the Admin thread per `00-MODEL-CONTEXT.md`
> section 3. **Target repo:** `Alkazat/Yaycay-BE` (the contract owner). This
> document is the source for a PR to open against `Yaycay-BE`; BE implements,
> bumps the contract version, and publishes. Admin then pins the new version
> and removes its local type stand-ins (`src/lib/contracts/types.ts`).
>
> Writing rule: no em-dashes.

## Why

The Admin app (scaffold landed) needs an admin-scoped read/write surface to
deliver the seven handoff screens. Today it runs on local stubs behind an env
switch. This request defines the smallest `/admin/*` surface that unblocks the
screens, in dependency order.

## Conventions

- **Base path:** all endpoints under `/admin`. Admin-scoped, off-domain.
- **Auth:** Supabase JWT with `role=admin` and AAL2 (verified MFA). BE rejects
  non-admin or non-MFA callers with `403`.
- **Audit:** every `/admin/*` call is logged server-side (actor, action,
  target, before/after for writes). Audit is a BE responsibility, not optional.
- **Errors:** RFC 9457 problem+json (`type`, `title`, `status`, `detail`).
- **Pagination:** cursor based: `?cursor=&limit=` -> `{ items, nextCursor }`.

## Endpoints (in build order)

### 1. Prompts (writes `prompts`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/prompts` | List prompts (latest version per task, or all versions with `?task=`) |
| GET | `/admin/prompts/{id}` | Get a single prompt version |
| POST | `/admin/prompts` | Create a new prompt for a task |
| POST | `/admin/prompts/{id}/versions` | Create a new version (immutable history) |
| POST | `/admin/prompts/{id}/activate` | Activate a version for its task (deactivates the prior active one) |
| GET | `/admin/prompts/{id}/diff?from=&to=` | Diff two versions |

Notes: versions are immutable; editing creates a new version. Exactly one
active version per task. `model` is chosen per prompt version.

### 2. Models / routing

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/models` | Available models + capabilities |
| GET | `/admin/model-routes` | Per-task default model + overrides |
| PUT | `/admin/model-routes/{task}` | Set default/override for a task |

Default for the use-our-AI tier is `claude-sonnet` (model context section 7).

### 3. Jobs (`ai_jobs`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/jobs` | Stream/list jobs; filter `?status=&kind=&tripId=` |
| GET | `/admin/jobs/{id}` | Job detail incl. model + prompt version used + error |
| POST | `/admin/jobs/{id}/retry` | Re-enqueue a failed job |
| GET | `/admin/jobs/cap?tripId=` | Daily-cap usage for a trip (cap ~10/day) |

### 4. Trips / customers (inspection; read-only by default)

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/trips?query=` | Search trips by customer email / destination / id |
| GET | `/admin/trips/{id}` | Trip summary + tier + retention |
| GET | `/admin/trips/{id}/content` | Canonical `trip_content` (model context section 5) |
| GET | `/admin/trips/{id}/profiles` | Child profiles for the trip |
| GET | `/admin/trips/{id}/progress` | Per-profile progress |
| GET | `/admin/customers?query=` | Account lookup, entitlement, retention |
| POST | `/admin/customers/{id}/deletion-request` | Record/honour a data-deletion request |

Edits to customer data are explicit, audited, and gated behind a separate
capability (out of scope for v0.2; propose in v0.3).

### 5. Content review

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/content-review` | Generated content awaiting review |
| POST | `/admin/content-review/{tripId}/approve` | Approve generated content for publish |
| POST | `/admin/content-review/{tripId}/edit` | Edit then publish (audited) |

### 6. Commerce (read-mostly; Stripe is source of truth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/products` | Catalogue (price id, name, amount) |
| GET | `/admin/purchases?query=` | Purchases / entitlement (from Stripe webhook -> `purchases`) |

## DTOs (TypeScript)

These mirror `src/lib/contracts/types.ts` in the Admin app verbatim so the two
do not diverge. When `@yaycay/contracts` v0.2 ships these, Admin deletes its
local copy and imports from the package.

```ts
export type Role = 'user' | 'admin';
export type TripTier = 'free' | 'byo' | 'ours';
export type AiModel = 'claude-sonnet' | 'claude-opus' | 'gemini' | 'openai';
export type AiJobKind = 'generation' | 'ingestion' | 'chat';
export type AiJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type ActivityKind = 'kid' | 'shared' | 'adult';

export interface Prompt {
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

export interface CustomerSummary {
  userId: string;
  email: string;
  tier: TripTier | null;
  retentionExpiresAt: string | null;
  deletionRequested: boolean;
}

export interface ProductSummary {
  priceId: string;
  name: string;
  amountUsd: number;
}

// TripContent / TripDay / TripMoment / TripActivity per model context section 5.
```

## OpenAPI 3.1 fragment (illustrative; BE owns the canonical spec)

```yaml
openapi: 3.1.0
info: { title: Yaycay Admin API, version: 0.2.0 }
paths:
  /admin/prompts:
    get:
      operationId: listPrompts
      parameters:
        - { name: task, in: query, schema: { type: string } }
        - { name: cursor, in: query, schema: { type: string } }
        - { name: limit, in: query, schema: { type: integer, default: 50 } }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  items: { type: array, items: { $ref: '#/components/schemas/Prompt' } }
                  nextCursor: { type: [string, 'null'] }
        '403': { description: Not an admin or MFA not satisfied }
    post:
      operationId: createPrompt
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [task, title, body, model]
              properties:
                task: { type: string }
                title: { type: string }
                body: { type: string }
                model: { $ref: '#/components/schemas/AiModel' }
      responses:
        '201': { description: Created }
  /admin/prompts/{id}/activate:
    post:
      operationId: activatePrompt
      parameters:
        - { name: id, in: path, required: true, schema: { type: string } }
      responses:
        '200': { description: Activated }
  /admin/jobs/{id}/retry:
    post:
      operationId: retryJob
      parameters:
        - { name: id, in: path, required: true, schema: { type: string } }
      responses:
        '202': { description: Re-enqueued }
components:
  schemas:
    AiModel:
      type: string
      enum: [claude-sonnet, claude-opus, gemini, openai]
    Prompt:
      type: object
      required: [id, task, title, body, model, version, active, updatedAt, updatedBy]
      properties:
        id: { type: string }
        task: { type: string }
        title: { type: string }
        body: { type: string }
        model: { $ref: '#/components/schemas/AiModel' }
        version: { type: integer }
        active: { type: boolean }
        updatedAt: { type: string, format: date-time }
        updatedBy: { type: string }
```

## Acceptance (BE side)

- All `/admin/*` require `role=admin` + AAL2; non-admins get `403` (pgTAP/RLS
  proves no cross-account leakage on the underlying tables).
- Prompt versions are immutable; exactly one active version per task.
- `retry` re-enqueues and writes a new `ai_jobs` row; cap logic enforced.
- Contract version bumped to `0.2.0` and published; Admin pins `^0.2.0`.
