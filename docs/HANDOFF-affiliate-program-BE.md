# Handoff to Yaycay-BE: affiliate / influencer program

**From:** Yaycay-Admin thread. **For:** Yaycay-BE (contract owner).
**Status:** Admin operator UI is built and runs on stubs today. It goes live the
moment the endpoints below exist and Admin re-pins `@alkazat/contracts`.

## What this is

Recruit influencers, give each a discount code that is also an attribution code,
track the revenue each code drives, and email the influencer a monthly summary
with the commission we owe them. Three surfaces touch it:

- **Admin** (this thread): create the affiliate, see attributed revenue, trigger
  the monthly report. Done, stub-backed.
- **BE** (you): the contract, Stripe coupon, purchase attribution, the report
  send. This document.
- **Website** (separate handoff): the public `/go/<slug>` landing page that sets
  the code and opens Checkout. See `HANDOFF-affiliate-program-WEBSITE.md`.

## Data model (new tables)

```
affiliates
  id              uuid pk
  name            text                -- influencer name
  email           text                -- where the monthly report is sent
  handle          text                -- social handle, e.g. "@sunnytravels"
  code            text unique         -- discount + attribution code, e.g. "SUNNY15"
  discount_percent    int             -- customer-facing discount
  commission_percent  int             -- what we pay on net revenue
  landing_slug    text unique         -- Website /go/<slug>
  stripe_coupon_id    text            -- the Stripe coupon/promotion code we create
  status          text                -- 'active' | 'paused'
  created_at      timestamptz

affiliate_redemptions   -- one row per attributed purchase (from the Stripe webhook)
  purchase_id     text pk
  affiliate_code  text fk -> affiliates.code
  owner_email     text
  price_id        text
  gross_usd       numeric             -- list price before discount
  discount_usd    numeric             -- discount the code applied
  net_usd         numeric             -- what the customer paid
  created_at      timestamptz
```

`affiliate_redemptions` can be a view over `purchases` if you store the applied
code + discount on the purchase instead (see attribution below). Either is fine;
Admin only reads the shape.

## Contract additions (`@alkazat/contracts`)

Add these DTOs. Admin already mirrors them locally in
`src/lib/contracts/types.ts` (block: "Pending contract: affiliate program") and
will delete the local copies when they land in the package.

```ts
type AffiliateStatus = 'active' | 'paused';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  handle: string;
  code: string;
  discountPercent: number;
  commissionPercent: number;
  landingSlug: string;
  status: AffiliateStatus;
  createdAt: string;
}

interface CreateAffiliateInput {
  name: string;
  email: string;
  handle: string;
  discountPercent: number;
  commissionPercent: number;
  // Admin derives and sends these; treat as hints, you are the authority:
  code: string;
  landingSlug: string;
}

interface AffiliateRedemption {
  purchaseId: string;
  ownerEmail: string;
  priceId: string;
  grossUsd: number;
  discountUsd: number;
  netUsd: number;
  createdAt: string;
}
```

Also: add `discountCode?: string` and `discountUsd?: number` to the existing
`PurchaseSummary`, so Commerce can show which purchases were affiliate-driven.

## Endpoints (all under the existing `/admin/*` surface: `role=admin` + AAL2, audited)

| Method + path                                | Body / query                | Returns                          | Notes |
| -------------------------------------------- | --------------------------- | -------------------------------- | ----- |
| `GET /admin/affiliates`                      | -                           | `{ items: Affiliate[], nextCursor }` | List. |
| `POST /admin/affiliates`                     | `CreateAffiliateInput`      | `Affiliate` (201)                | Create the affiliate AND the Stripe coupon. Reject a duplicate `code` (409). You own uniqueness; the Admin-suggested `code`/`landingSlug` are derived from the handle + discount and may collide. |
| `GET /admin/affiliates/{code}`               | -                           | `Affiliate`                      | Detail. |
| `PATCH /admin/affiliates/{code}`             | `{ status }`                | `Affiliate`                      | Pause / reactivate. Pausing should disable the Stripe promo code so it stops redeeming. |
| `GET /admin/affiliates/{code}/redemptions`   | `?cursor=&limit=`           | `{ items: AffiliateRedemption[], nextCursor }` | Attributed purchases. |
| `POST /admin/affiliates/{code}/report`       | `{ periodStart, periodEnd }` (ISO dates) | `{ sent: true }`     | Render + send the monthly email via the transactional sender (Brevo) to the affiliate's email, and record it. Admin computes the same totals client-side for display but never sends the body; you are the source of truth for what gets emailed. |

## Stripe coupon + attribution (the core of it)

1. **On create:** make a Stripe coupon for `discount_percent` and a promotion code
   equal to `code` (uppercased). Store `stripe_coupon_id`. Pausing
   (`PATCH ... {status:'paused'}`) sets the promotion code inactive.
2. **At Checkout:** the Website opens a Checkout session with the code applied
   (it passes the code; you attach the promotion code / `discounts`). Allow
   promotion codes on the session.
3. **In the webhook:** when `checkout.session.completed` carries a discount whose
   promotion code matches an affiliate `code`, write an `affiliate_redemptions`
   row (or stamp `discount_code` + `discount_usd` on the `purchases` row).
   `gross_usd` = amount before discount, `net_usd` = amount paid.

That webhook attribution is the only thing that makes the numbers real; without
it Admin shows zeros. Everything else is plumbing around it.

## Report math (so BE and Admin agree to the cent)

For a period `[periodStart, periodEnd)` (end exclusive), over redemptions whose
`created_at` date falls in the window:

```
grossRevenue   = sum(gross_usd)
discountGiven  = sum(discount_usd)
netRevenue     = sum(net_usd)
commissionOwed = round2(netRevenue * commission_percent / 100)
```

Commission is on **net** (post-discount) revenue. Round to 2 dp. Admin's
`src/lib/affiliates/report.ts` is the reference implementation and is unit
tested; mirror it.

## Audit

`POST/PATCH` here must write the standard audit entry (actor, action, target,
before/after). Admin records `affiliate.create`, `affiliate.status`, and
`affiliate.report-send` locally today; BE owns the canonical sink.

## Definition of done

- The six endpoints return the documented shapes under admin auth.
- Creating an affiliate creates a usable Stripe promotion code.
- A test purchase with the code lands as a redemption within the webhook.
- `POST .../report` sends a real email to the affiliate and is idempotent enough
  to re-send safely.
- Reply to the Admin thread with the published `@alkazat/contracts` version so
  Admin re-pins and swaps its local DTOs for the package.
