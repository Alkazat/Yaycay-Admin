# Handoff to Yaycay-BE: publish the user-management DTOs (contract bump)

**From:** Yaycay-Admin thread. **For:** Yaycay-BE (contract owner).
**Ask:** one focused thing — **publish the user-management DTOs in
`@alkazat/contracts` and cut a new version.** The endpoints are already live and
Admin already consumes them; this is the last step to make it a single typed
source.

## Why

`@alkazat/contracts` is still `0.33.0`, which has no DTOs for the enriched user
rows or the write bodies. So Admin currently reads the rich columns "ahead of
contract" via a local `EnrichedUser = CustomerSummary & Partial<…>` and keeps
local view-models. Once you publish the types below, Admin bumps the pin, swaps
to the typed `AdminUserRow`, and **deletes its local stand-ins** in
`src/lib/contracts/types.ts`.

## Publish these (names Admin already uses)

```ts
export type AdminUserStatus = 'active' | 'invited' | 'deletion-requested';

// Either enrich CustomerSummary in place with these fields, OR publish
// AdminUserRow as the row type returned by GET /admin/users (or /admin/customers).
export interface AdminUserRow {
  userId: string;
  email: string;
  tier: TripTier | null;
  retentionExpiresAt: string | null;
  deletionRequested: boolean;
  status: AdminUserStatus;
  createdAt: string | null;     // "user since"
  lastLoginAt: string | null;   // last successful sign-in
  explorerCount: number;        // child profiles on the account
  grownupCount: number;         // adult travellers on the account
  tripCount: number;            // trips owned
}

export interface UpdateCustomerEmailInput { email: string }

export interface CreateTripInput {
  ownerEmail: string;
  destination: string;
  tier: TripTier;          // 'ours' | 'byo'
  startDate: string;       // ISO date
  endDate: string;         // ISO date
}
```

## Please confirm (so the live columns are correct, not just present)

Admin maps the read defensively, so a name mismatch shows as a blank/0 column
rather than an error. Please confirm the **field names match exactly** and tell
us **which endpoint** serves the enriched rows:

- [ ] Enriched **`GET /admin/customers`** in place, **or** new **`GET /admin/users`**?
- [ ] Field names exactly: `status`, `createdAt`, `lastLoginAt`,
      `explorerCount`, `grownupCount`, `tripCount`?

If any name differs (e.g. `childCount` instead of `explorerCount`), just send the
real shape and Admin matches it in one patch.

## Done when

`@alkazat/contracts` publishes a version exporting `AdminUserStatus`,
`AdminUserRow` (or the enriched `CustomerSummary`), `UpdateCustomerEmailInput`,
and `CreateTripInput`. Admin then pins it, swaps the defensive read for the typed
row, and removes the local view-models.
