# Admin <-> BE completion check (2026-06-16)

**From:** Yaycay-Admin. **For:** Yaycay-BE.

> **ALL CLOSED (2026-06-16).** Every Admin dependency on BE is live on prod.
> One cosmetic tail: the contract has not published `UpdateAffiliateInput`, so
> Admin keeps that single local stand-in until the next `@alkazat/contracts`
> bump (does not block anything - edit already calls the live `PUT`).

---

## 1. Affiliates core - DONE

- [x] `POST /admin/affiliates` (create) - Stripe-key 500 fixed (dedicated
      `STRIPE_COUPON_KEY`, self-diagnosing handler, idempotent retry).
- [x] `GET /admin/affiliates` (list) + `GET /admin/affiliates/{code}` (detail).
- [x] `PATCH /admin/affiliates/{code}` (pause / reactivate).
- [x] `GET /admin/affiliates/{code}/redemptions`.
- [x] `POST /admin/affiliates/{code}/report` (Brevo send).

## 2. Affiliate edit + archive - DONE

- [x] `PUT /admin/affiliates/{code}` - edit fields; recreates the Stripe coupon
      when `discountPercent`/`code` change.
- [x] `DELETE /admin/affiliates/{code}` - soft archive (deactivate coupon, drop
      from active list, keep redemptions).
- [ ] Publish `UpdateAffiliateInput` in `@alkazat/contracts` - **still pending**
      (latest is 0.27.0). Admin drops its local stand-in on the bump.

## 3. Connectors ("Connected assistants") - DONE

- [x] `GET /admin/connectors?query=&cursor=`.
- [x] `POST /admin/connectors/{id}/revoke` (revoke cuts the grant's tokens).
- [x] `plan_trip` writes logged to `ai_jobs` with `source='connector'` (visible
      in Admin Jobs, counted against the cap).
- [x] Connector-generated `trip_content` routed through Content Review.

## 4. Cross-cutting - DONE

- [x] Canonical audit sink for `/admin/*` writes.
- [x] `GET /admin/jobs` returns 200 (was 500).
- [x] `GET /admin/products` scoped to the deployment's Stripe mode + `livemode`.

## 5. Admin side - DONE

- [x] Pinned `@alkazat/contracts@^0.27.0`.
- [x] Dropped local affiliate + connector DTO stand-ins (now from the package).
- [x] Create / list / detail / pause / edit / archive / redemptions / report /
      connectors all wired to live BE and shipped to prod.

## 6. Optional follow-ups (BE's call, no rush)

- [ ] Staging affiliates: add `STAGING_STRIPE_COUPON_KEY` (rk*test*...).
- [ ] End-to-end redemption test: real checkout with an affiliate code ->
      webhook stamps the redemption -> report math matches (Admin's reference
      already matches to the cent).

---

**Only open item:** publish `UpdateAffiliateInput` in a contract bump (2 above);
ping Admin with the version and the last local stand-in is removed.
