# Handoff to Yaycay-BE: full admin user-management surface

**From:** Yaycay-Admin thread. **For:** Yaycay-BE (contract owner).

> **STATUS: Admin UI built and live in dev/preview against the in-memory store;
> the whole workflow is testable now.** Live mode lights up as BE ships each
> piece below. Until then, the new writes fail soft (show the HTTP status) and
> the rich table columns render as null/0.

Admin now treats the operator as a true administrator: invite, change email,
manage trips, and a two-step GDPR deletion - all from `/customers` (Users) and
`/trips`, with no paywall. The thin contract `CustomerSummary` blocks two
things: the **rich Users table** and the new **write endpoints**.

## 1. Enrich the Users list (table columns)

The Users table wants these per-user fields. Either **add them to
`CustomerSummary`** (simplest for us) or publish a richer **`GET /admin/users`**.

```ts
interface AdminUserRow {
  // existing CustomerSummary
  userId: string;
  email: string;
  tier: TripTier | null;
  retentionExpiresAt: string | null;
  deletionRequested: boolean;
  // NEW
  status: 'active' | 'invited' | 'deletion-requested';
  createdAt: string | null;     // "user since"
  lastLoginAt: string | null;   // last successful sign-in
  explorerCount: number;        // child profiles on the account
  grownupCount: number;         // adult travellers on the account
  tripCount: number;            // trips owned
}
```

`status`: `invited` = magic-link sent, never signed in; `active` = has signed
in; `deletion-requested` = a deletion is pending execution. Admin currently
derives `status` from `deletionRequested` when the field is absent, and shows
the counts/dates as null/0 until you populate them.

## 2. Write endpoints

All under the existing `/admin/*` surface (role=admin + AAL2, audited). Admin
already audits each action locally too.

| Action | Method + path | Body | Notes |
| --- | --- | --- | --- |
| Change email | `PATCH /admin/customers/{id}/email` | `{ email }` | Identity store update; keep magic-link/2FA intact. Re-point owned trips. |
| Request deletion | `POST /admin/customers/{id}/deletion-request` | — | **Already live.** Marks + schedules; sets `deletionRequested`. |
| Execute deletion | `POST /admin/customers/{id}/deletion-execute` | — | **Irreversible.** Purge the user + their trips/profiles/data. Returns `{ deleted: true }`. |
| Remove invite | `DELETE /admin/customers/{id}` | — | For never-activated invites only (no data to purge). Returns `{ removed: true }`. |
| Create trip (no paywall) | `POST /admin/trips` | `CreateTripInput` | Assign trip + tier entitlement directly, skip Stripe. Returns `AdminTripSummary`. |
| Delete trip | `DELETE /admin/trips/{id}` | — | Returns `{ deleted: true }`. |

```ts
interface UpdateCustomerEmailInput { email: string }
interface CreateTripInput {
  ownerEmail: string;
  destination: string;
  tier: TripTier;          // 'ours' | 'byo'
  startDate: string;       // ISO date
  endDate: string;         // ISO date
}
```

## 3. Contract / DTOs to publish

Publish in `@alkazat/contracts` so Admin can drop its local stand-ins:
`AdminUserRow` (or the enriched `CustomerSummary`), `UpdateCustomerEmailInput`,
`CreateTripInput`, and the `AdminUserStatus` union. (Also still pending from the
prior handoff: `InviteCustomerInput`.)

## 4. Guardrails / decisions already made

- **Two-step deletion** is deliberate: request (reversible, scheduled) then a
  separate, typed-`DELETE`-confirmed execute. Admin will not call execute
  without an explicit confirm.
- **No paywall** for admin-created trips: BE grants the entitlement directly.
  This is an admin-only path; the normal app still goes through Stripe.
- Identity stays the isolated store (Supabase Auth, magic-link + 2FA, no
  passwords). Email change must not weaken that.

## 5. Done when

`GET /admin/customers` (or `/admin/users`) returns the enriched rows, the five
write endpoints above are deployed, and the DTOs are published. Admin then bumps
the contract pin and removes the local view-models in `src/lib/contracts/types.ts`.

<!-- ci: re-trigger checks -->
