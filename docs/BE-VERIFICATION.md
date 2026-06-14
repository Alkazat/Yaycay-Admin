# Yaycay-BE - Admin verification & gap checklist

**From:** Yaycay-Admin thread. **For:** Yaycay-BE.

The Admin console is deployed, signed-in (Supabase JWT, `role=admin` + AAL2),
and calling the live `/admin/*` surface. Some endpoints work, some error, some
fields are missing. Work down this list: for each item, **confirm it exists and
returns 200**; if not, the **"If missing / needed"** column says exactly what to
build. All admin calls are server-to-server with the admin JWT as
`Authorization: Bearer <token>`.

Tick the box when confirmed green.

---

## 1. Known issues from live testing (fix first)

| #   | Symptom (observed in prod Admin)                                                                              | What BE needs to do                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `GET /admin/jobs` returns **HTTP 500**                                                                        | Handler throws server-side. Check logs for the stack trace - likely the `ai_jobs` query, a missing column/migration, or an unhandled exception. Must return 200 with `{ items, nextCursor }`.                  |
| 2   | `GET /admin/products` returns **both live and test** Stripe products (prod Admin shows 4: 2 live + 2 sandbox) | Scope the catalogue to the deployment's Stripe mode: **production = live only**, staging = test only. Filter on Stripe `livemode`, or use only the live key in prod, or scope the source table by environment. |
| 3   | Missing-claim handling                                                                                        | If a handler reads a JWT claim (`role`/AAL) that's absent, it should return **403**, never 500. Confirm where `role=admin` and AAL2 live in the token.                                                         |

---

## 2. Endpoint checklist

For each: confirm it returns **200** with the documented shape. List responses
use the `{ items, nextCursor }` envelope.

| Confirmed | Method + path                                    | Admin screen   | Expected response                            | If missing / needed                                              |
| --------- | ------------------------------------------------ | -------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| [ ]       | `GET /admin/prompts` (optional `?task=`)         | Prompts        | `{ items: Prompt[], nextCursor }`            | Implement list (latest per task, or all versions when `?task=`). |
| [ ]       | `POST /admin/prompts`                            | Prompts        | `Prompt` (201)                               | Create a task's first prompt.                                    |
| [ ]       | `POST /admin/prompts/{id}/versions`              | Prompts        | `Prompt` (201)                               | New immutable version of an existing prompt.                     |
| [ ]       | `POST /admin/prompts/{id}/activate`              | Prompts        | `Prompt`                                     | Activate a version; deactivate the prior active one.             |
| [ ]       | `GET /admin/models`                              | Models         | `{ items: { model, vision, streaming }[] }`  | Available models + capabilities.                                 |
| [ ]       | `GET /admin/model-routes`                        | Models         | `{ items: ModelRoute[] }`                    | Per-task default + override.                                     |
| [ ]       | `PUT /admin/model-routes/{task}`                 | Models         | `ModelRoute`                                 | Set default/override for a task.                                 |
| [ ]       | `GET /admin/jobs` (filters `status,kind,tripId`) | Jobs           | `{ items: AiJob[], nextCursor }`             | **Currently 500 - see section 1.**                               |
| [ ]       | `POST /admin/jobs/{id}/retry`                    | Jobs           | `AiJob` (202)                                | Re-enqueue a failed job (new `ai_jobs` row; cap enforced).       |
| [ ]       | `GET /admin/jobs/cap?tripId=`                    | Jobs           | `JobCapUsage`                                | Daily-cap usage (~10/day).                                       |
| [ ]       | `GET /admin/trips?query=&cursor=`                | Trips          | `{ items: AdminTripSummary[], nextCursor }`  | Search by email / destination / id.                              |
| [ ]       | `GET /admin/trips/{id}/content`                  | Trips          | `TripContent`                                | Canonical trip content for inspection.                           |
| [ ]       | `GET /admin/trips/{id}/profiles`                 | Trips          | `{ items: AdminChildProfile[] }`             | Child profiles - see field gap in section 3.                     |
| [ ]       | `GET /admin/trips/{id}/progress`                 | Trips          | `{ items: AdminProgress[] }`                 | Per-profile progress.                                            |
| [ ]       | `GET /admin/customers?query=&cursor=`            | Customers      | `{ items: CustomerSummary[], nextCursor }`   | Account lookup / entitlement / retention.                        |
| [ ]       | `POST /admin/customers/{id}/deletion-request`    | Customers      | `CustomerSummary`                            | Record a data-deletion request.                                  |
| [ ]       | `GET /admin/content-review`                      | Content review | `{ items: ContentReviewItem[], nextCursor }` | Generated content awaiting review.                               |
| [ ]       | `POST /admin/content-review/{tripId}/approve`    | Content review | `ContentReviewItem`                          | Approve as is.                                                   |
| [ ]       | `POST /admin/content-review/{tripId}/edit`       | Content review | `ContentReviewItem`                          | Body = edited `TripContent`; validate against the schema.        |
| [ ]       | `GET /admin/products`                            | Commerce       | `{ items: ProductSummary[] }`                | **Returns mixed modes - see section 1.**                         |
| [ ]       | `GET /admin/purchases?query=&cursor=`            | Commerce       | `{ items: PurchaseSummary[], nextCursor }`   | Purchases / entitlement from the Stripe webhook.                 |

---

## 3. Field additions Admin needs (contract change)

The Admin UI already renders these; they light up once BE adds the fields.

| Confirmed | Type                | Add field(s)                             | Why                                                                          |
| --------- | ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| [ ]       | `ProductSummary`    | `livemode: boolean`                      | Commerce shows a Live/Test badge so a mode mix can't look like real pricing. |
| [ ]       | `PurchaseSummary`   | `livemode: boolean`                      | Same, for purchases.                                                         |
| [ ]       | `AdminChildProfile` | `dietary: string[]`, `medical: string[]` | Profiles view surfaces safety flags (allergy/EpiPen) for troubleshooting.    |
| [ ]       | `ChildProfile` / `AdminChildProfile` | `type: 'child' \| 'guardian'`, `pin_set: boolean` (read-only) | User Types & Access handoff (2026-06-13). Admin profile view will badge the profile type and whether a guardian PIN is set. **Queued in Admin pending this contract bump** - see note below. |

---

## 4. Reward-economy reads (only if ops needs to troubleshoot them)

| Confirmed | Method + path                   | Expected         | Notes                                         |
| --------- | ------------------------------- | ---------------- | --------------------------------------------- |
| [ ]       | `GET /admin/trips/{id}/stars`   | `{ items: ... }` | Per-child star balances. New endpoint.        |
| [ ]       | `GET /admin/trips/{id}/packing` | `{ items: ... }` | Packing lists. New endpoint.                  |
| [ ]       | `GET /admin/trips/{id}/journal` | `{ items: ... }` | Journal entries (+ mood/media). New endpoint. |

(`/admin/trips/{id}/progress` already exists above; no action.)

---

## 5. Cross-cutting (confirm once)

| Confirmed | Requirement                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| [ ]       | Every `/admin/*` requires `role=admin` + **AAL2**; non-admin/non-MFA -> **403** (not 500).                        |
| [ ]       | Errors are RFC 9457 `application/problem+json`.                                                                   |
| [ ]       | List endpoints use cursor pagination: `?cursor=&limit=` -> `{ items, nextCursor }`.                               |
| [ ]       | All `/admin/*` writes are audited server-side (actor, action, target, before/after).                              |
| [ ]       | Reply to the Admin thread with the published `@alkazat/contracts` version once any DTOs change, so Admin re-pins. |

---

## What Admin does on its side (so you know the contract is honoured)

- Admin never reads a field not in the contract; local type stand-ins mirror the
  published package and are swapped for it on each version bump.
- Read endpoints **fail soft**: a non-200 logs the status and renders an empty
  screen rather than crashing, so a single broken endpoint never takes the
  console down. The dashboard shows the failing HTTP status for `/admin/jobs`.

### Queued: User Types & Access (handoff 2026-06-13)

Held pending the `@alkazat/contracts` bump that publishes `type` + `pin_set` on
the profile DTO (section 3). Once Admin re-pins to that version, in one pass:

- Map `mode` to friendly persona labels in the trip inspector - 🐣 Little
  Explorer (`little`), 🧭 Explorer (`explorer`), 🚀 Big Explorer
  (`explorer_plus`), 🛡️ Grown Ups (`standard`).
- Badge **profile type** (child / guardian) and **PIN set** on the profile view
  in `trips/[tripId]`.

The PIN gate, kid-experience features, and the Explorers/Grown-ups views are
customer-FE/BE concerns - no Admin action.
