# Handoff to Yaycay-BE: edit + archive an affiliate

**From:** Yaycay-Admin thread. **For:** Yaycay-BE (contract owner).
**Context:** affiliates are live (create / list / get / PATCH-status / redemptions
/ report). Admin now has **Edit** and **Archive** UI on `/affiliates/{code}`,
but they need two new endpoints. Until they ship, those buttons fail soft and
show the HTTP status (e.g. "HTTP 404 - endpoint not deployed").

Operator decisions already made (so build to these):
- **Archive, not hard delete.** Removing keeps the record + past redemptions for
  reporting; it just deactivates the code and drops it from the active list.
- **Full edit, incl. discount % and code.** Changing those recreates the Stripe
  coupon (coupons are immutable).

## 1. Edit - `PUT /admin/affiliates/{code}`

`{code}` is the affiliate's CURRENT code. Body (`UpdateAffiliateInput`, mirrors
the Admin stand-in):

```ts
interface UpdateAffiliateInput {
  name: string;
  email: string;
  handle: string;
  discountPercent: number;
  commissionPercent: number;
  code: string; // may differ from {code} -> recreate the coupon
}
```

Returns the updated `Affiliate` (200). Behaviour:
- `name` / `email` / `handle` / `commissionPercent` -> plain row update (our data).
- `discountPercent` or `code` changed -> **deactivate the old Stripe coupon and
  create a new one** for the new code/percent; keep historical redemptions
  pointing at whatever code applied at purchase time (do not rewrite history).
- Reject a `code` that collides with another affiliate (409).

## 2. Archive - `DELETE /admin/affiliates/{code}`

Soft archive (200 or 204). Behaviour:
- Mark the affiliate archived; **deactivate its Stripe promotion code** so it
  stops redeeming.
- Exclude archived affiliates from the default `GET /admin/affiliates` list
  (optionally support `?includeArchived=true` later).
- Keep the row + its `affiliate_redemptions` for reporting/payouts.
- Idempotent: archiving an already-archived affiliate is a no-op 200.

(If you'd rather model archive as a status, add `'archived'` to
`AffiliateStatus` and expose it via PATCH instead - tell us and Admin will
follow. We assumed DELETE so the existing PATCH stays status-only.)

## 3. Contract + cross-cutting

- Publish `UpdateAffiliateInput` in `@alkazat/contracts`; Admin will drop its
  local stand-in on the next bump (same pattern as the other affiliate DTOs).
- Both routes are under `/admin/*` (role=admin + AAL2) and must be audited
  (actor, action `affiliate.update` / `affiliate.archive`, target, before/after).
- Admin records those audit actions locally already.

## Definition of done
- `PUT` edits fields and recreates the coupon when discount/code change.
- `DELETE` archives (soft), deactivates the coupon, hides from the active list,
  preserves redemptions.
- Reply with the published contract version carrying `UpdateAffiliateInput`.
