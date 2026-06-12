# Contract status: Admin dependencies on `@alkazat/contracts`

Tracks what the Admin app needs from BE (the contract owner) and what has
landed. Until an endpoint is live, the matching data accessor in
`src/lib/data/index.ts` falls back to the local stub layer via `notWiredYet`.

- **Target version:** `@alkazat/contracts@0.5.0` (published by BE; supersedes
  the original v0.2 proposal - the live surface must be reconciled against the
  published package, since it may differ from the v0.2 request)
- **Published version Admin is pinned to:** none yet - local stand-ins in
  `src/lib/contracts/types.ts` now mirror the published v0.5.0 shapes
- **Client wiring: DONE.** Every `/admin/*` accessor in `src/lib/data/index.ts`
  calls the live API (`src/lib/data/api.ts`, admin JWT) when
  `NEXT_PUBLIC_API_BASE` is set, and serves stubs otherwise. Remaining to go
  live: install `@alkazat/contracts@^0.5.0` for the real types, set
  `NEXT_PUBLIC_API_BASE` in Vercel, and verify against staging.
- **Spec source:** `docs/be-contract-proposal-admin-v0.2.md`
- **BE handoff brief:** see the contracts bundle (HANDOFF-TO-BE.md)

Update the Status column as BE delivers. When an endpoint goes live, swap the
`notWiredYet` branch for the real call and tick it here.

## Endpoints

| #   | Admin accessor            | Endpoint                                      | Screen         | Status                                     |
| --- | ------------------------- | --------------------------------------------- | -------------- | ------------------------------------------ |
| 1   | `listPrompts`             | `GET /admin/prompts`                          | Prompts        | Outstanding                                |
| 2   | `createPromptVersion`     | `POST /admin/prompts/{id}/versions`           | Prompts        | Outstanding                                |
| 3   | `activatePrompt`          | `POST /admin/prompts/{id}/activate`           | Prompts        | Outstanding                                |
| 4   | `listModelRoutes`         | `GET /admin/model-routes`                     | Models         | Outstanding                                |
| 5   | (set route)               | `PUT /admin/model-routes/{task}`              | Models         | Outstanding (UI not built)                 |
| 6   | `listJobs`                | `GET /admin/jobs`                             | Jobs           | Outstanding                                |
| 7   | `retryJob`                | `POST /admin/jobs/{id}/retry`                 | Jobs           | Outstanding                                |
| 8   | (cap usage)               | `GET /admin/jobs/cap?tripId=`                 | Jobs           | Outstanding (computed client-side for now) |
| 9   | `listTrips`               | `GET /admin/trips?query=`                     | Trips          | Outstanding                                |
| 10  | `getTripContent`          | `GET /admin/trips/{id}/content`               | Trips          | Outstanding                                |
| 11  | (profiles)                | `GET /admin/trips/{id}/profiles`              | Trips          | Outstanding (UI not built)                 |
| 12  | (progress)                | `GET /admin/trips/{id}/progress`              | Trips          | Outstanding (UI not built)                 |
| 13  | `listCustomers`           | `GET /admin/customers?query=`                 | Customers      | Outstanding                                |
| 14  | `requestCustomerDeletion` | `POST /admin/customers/{id}/deletion-request` | Customers      | Outstanding                                |
| 15  | `listReviewItems`         | `GET /admin/content-review`                   | Content review | Outstanding                                |
| 16  | `decideReview` (approve)  | `POST /admin/content-review/{tripId}/approve` | Content review | Outstanding                                |
| 17  | `decideReview` (publish)  | publish step (TBD path)                       | Content review | Outstanding                                |
| 18  | (edit)                    | `POST /admin/content-review/{tripId}/edit`    | Content review | Outstanding (UI not built)                 |
| 19  | `listProducts`            | `GET /admin/products`                         | Commerce       | Outstanding                                |
| 20  | `listPurchases`           | `GET /admin/purchases?query=`                 | Commerce       | Outstanding                                |

## Cross-cutting (not endpoint-specific)

| Item                                                         | Status                                      |
| ------------------------------------------------------------ | ------------------------------------------- |
| Publish `@alkazat/contracts` (types + `openapi.yaml`)        | Published at 0.5.0 (reconcile surface)      |
| Auth claim shape: `role` location in JWT + AAL level for MFA | Outstanding (blocks `getAdminSession()`)    |
| Canonical audit sink (endpoint or table)                     | Outstanding (Admin records locally for now) |
| `/admin/*` requires `role=admin` + AAL2; audited writes      | Outstanding (BE-enforced)                   |
| problem+json errors; cursor pagination `?cursor=&limit=`     | Outstanding (convention)                    |

## Incoming from FE (additive; not blocking Admin)

The FE roadmap (`05-FE-ROADMAP.md`, section D) raises content-model and endpoint
additions on BE. These are additive: the admin Trips inspector and Content
review ignore unknown fields, so nothing breaks. Track these so the inspector
can surface them once they land in the admin contract.

| Item               | What                                                                                                                                                                                   | Admin action (when the contract carries it)                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Content fields     | `variants.standard`, `activity.challenge` (typed + answer), `activity.facts[]`, `day.did_you_know`, `day.weather`, `day.hotel`/move, `day.game`, `day.star_challenge`, `location.zoom` | Enrich the Trip inspector to render these, so an admin sees what a family sees                                                |
| ChildProfile flags | medical / dietary flags on `ChildProfile` (not yet on `AdminChildProfile`)                                                                                                             | Surface in the admin profiles view for safety troubleshooting                                                                 |
| Reward / progress  | stars, packing, journal, progress detail                                                                                                                                               | If ops needs to troubleshoot these, request the matching `/admin/*` reads on BE (`/admin/trips/{id}/progress` already exists) |

## Wiring procedure (per endpoint, once live)

1. Pin `@alkazat/contracts@^0.5.0`; replace the import in
   `src/lib/contracts/types.ts` with the package types and reconcile any drift.
2. In the matching `src/lib/data/index.ts` accessor, replace the `notWiredYet`
   branch with the real call (admin Supabase client or `NEXT_PUBLIC_API_BASE`).
3. Keep the stub branch behind `!isAdminDataLive()` (i.e. served until
   `NEXT_PUBLIC_API_BASE` is set) for local dev and the pre-BE state.
4. Mark the row here as Live.
