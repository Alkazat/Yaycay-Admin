# Admin ↔ BE completion check (2026-06-16)

**From:** Yaycay-Admin. **For:** Yaycay-BE.
Tick each box once confirmed. Grouped by "confirmed done", "Admin already did
its part", and "still open".

---

## 1. Confirmed done by BE (affiliates core) - please tick to close

- [ ] `POST /admin/affiliates` (create) - the Stripe-key 500 is fixed
      (dedicated `STRIPE_COUPON_KEY`, self-diagnosing handler, idempotent retry).
- [ ] `GET /admin/affiliates` (list) + `GET /admin/affiliates/{code}` (detail).
- [ ] `PATCH /admin/affiliates/{code}` (pause / reactivate).
- [ ] `GET /admin/affiliates/{code}/redemptions`.
- [ ] `POST /admin/affiliates/{code}/report` (Brevo send).

These match what BE reported as live. No Admin action outstanding for these.

## 2. Admin already did its part (FYI - no BE action)

- [x] Pinned `@alkazat/contracts@^0.27.0`.
- [x] Dropped local affiliate + connector DTO stand-ins (now from the package).
- [x] Create / list / detail / pause / redemptions / report all wired to live BE
      and shipped to prod.

## 3. Still OPEN - need BE to build/confirm

### 3a. Affiliate edit + archive (Admin UI is live, calling these now)
- [ ] `PUT /admin/affiliates/{code}` - edit fields; **recreate the Stripe
      coupon** when `discountPercent` or `code` change (coupons are immutable).
- [ ] `DELETE /admin/affiliates/{code}` - **soft archive**: deactivate the
      coupon, drop from the active list, keep the row + redemptions.
- [ ] Publish `UpdateAffiliateInput` in `@alkazat/contracts` (Admin will drop
      its last local stand-in on the bump).
- Spec: `docs/HANDOFF-affiliate-edit-archive-BE.md`.
- Until live, the Edit/Archive buttons fail soft and show the HTTP status
  ("HTTP 404 - endpoint not deployed").

### 3b. Connectors ("Connected assistants")
- [ ] `GET /admin/connectors?query=&cursor=` deployed and returning data.
- [ ] `POST /admin/connectors/{id}/revoke` - and revoke actually cuts the
      grant's tokens (not just a flag).
- [ ] `plan_trip` (BYO-AI) writes are logged to `ai_jobs` with
      `source='connector'` so they show in Admin Jobs and count against the cap.
- [ ] Connector-generated `trip_content` routes through Content Review (or is
      flagged) - external models have no guardrail.
- Spec: `docs/HANDOFF-connectors-admin-BE.md`.

### 3c. Audit sink
- [ ] A canonical audit store (endpoint or table) for every `/admin/*` write
      (actor, action, target, before/after). Admin records locally today; BE
      owns the durable sink.

### 3d. Earlier prod issues - confirm resolved
- [ ] `GET /admin/jobs` returns 200 (was 500).
- [ ] `GET /admin/products` is scoped to the deployment's Stripe mode
      (prod = live only) and carries `livemode`.

## 4. BE's optional follow-ups (acknowledged, no rush)

- [ ] Staging affiliates: add `STAGING_STRIPE_COUPON_KEY` (rk_test_...).
- [ ] End-to-end redemption test: real checkout with an affiliate code ->
      webhook stamps the redemption -> report math matches (Admin's reference
      already matches to the cent).

---

When 3a-3c land, reply with the published `@alkazat/contracts` version and
Admin re-pins + drops the `UpdateAffiliateInput` stand-in. Everything in Admin
is already built to consume these the moment they exist.
