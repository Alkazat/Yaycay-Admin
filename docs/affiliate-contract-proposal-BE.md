# Contract proposal for Yaycay-BE: affiliate / influencer program

**From:** Yaycay-Admin thread. **For:** Yaycay-BE (contract owner).
**Paired with:** the operator UI in Yaycay-Admin (built, stub-backed, ready to
re-pin) and the funnel work in `HANDOFF-affiliate-program-WEBSITE.md`.

This is paste-ready: a suggested PR title/body, the exact `@alkazat/contracts`
type additions, the OpenAPI paths + schemas, and the data / Stripe / send work
behind them.

---

## Suggested PR (open against Yaycay-BE)

**Title:** `feat(contracts): affiliate/influencer program DTOs + /admin/affiliates endpoints`

**Body:**

> Adds the affiliate program to the admin-scoped contract so Yaycay-Admin can go
> live (operator UI already built and stubbed). Recruit an influencer, give them
> a discount code that is also an attribution code, track the revenue each code
> drives, and email them a monthly commission report. The only part that makes
> the numbers real is the Stripe webhook attribution (section "Stripe coupon +
> attribution"). Reply with the published contract version so Admin re-pins.

---

## 1. What this is

Three surfaces touch it:

- **Admin** (done): create the affiliate, see attributed revenue, trigger the
  monthly report.
- **BE** (you): the contract, the Stripe coupon, purchase attribution, the
  report send. This document.
- **Website** (separate brief): the public `/go/<slug>` landing page that sets
  the code and opens Checkout.

## 2. Contract additions (`@alkazat/contracts`)

Admin already mirrors these locally in `src/lib/contracts/types.ts` (block
"Pending contract: affiliate program") and deletes the local copies on re-pin.

```ts
export type AffiliateStatus = 'active' | 'paused';

/** An influencer in the affiliate program. */
export interface Affiliate {
  id: string;
  name: string;            // influencer name (shown on the report)
  email: string;           // where the monthly report is sent
  handle: string;          // social handle, e.g. "@sunnytravels"
  code: string;            // discount + attribution code, e.g. "SUNNY15"
  discountPercent: number; // customer-facing discount
  commissionPercent: number; // what we pay the influencer on net revenue
  landingSlug: string;     // Website /go/<slug>
  status: AffiliateStatus;
  createdAt: string;       // ISO 8601
}

/** Request body for creating an affiliate. */
export interface CreateAffiliateInput {
  name: string;
  email: string;
  handle: string;
  discountPercent: number;
  commissionPercent: number;
  // Admin derives and sends these as hints; BE is the authority and owns
  // uniqueness (reject a duplicate code with 409).
  code: string;
  landingSlug: string;
}

/** One purchase attributed to an affiliate code (from the Stripe webhook). */
export interface AffiliateRedemption {
  purchaseId: string;
  ownerEmail: string;
  priceId: string;
  grossUsd: number;    // list price before the discount
  discountUsd: number; // discount the code applied
  netUsd: number;      // what the customer actually paid
  createdAt: string;   // ISO 8601
}
```

Also add to the existing `PurchaseSummary` so Commerce can mark affiliate-driven
sales:

```ts
  discountCode?: string;
  discountUsd?: number;
```

## 3. Endpoints (OpenAPI)

All under the existing `/admin/*` surface: `role=admin` + AAL2, RFC 9457
`problem+json` errors, cursor pagination, audited writes.

```yaml
paths:
  /admin/affiliates:
    get:
      summary: List affiliates
      parameters:
        - { name: cursor, in: query, schema: { type: string } }
        - { name: limit, in: query, schema: { type: integer } }
      responses:
        '200':
          description: A page of affiliates
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AffiliatePage' }
    post:
      summary: Create an affiliate and its Stripe coupon
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreateAffiliateInput' }
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Affiliate' }
        '409':
          description: Code already in use
          content:
            application/problem+json:
              schema: { $ref: '#/components/schemas/Problem' }

  /admin/affiliates/{code}:
    parameters:
      - { name: code, in: path, required: true, schema: { type: string } }
    get:
      summary: Affiliate detail
      responses:
        '200':
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Affiliate' }
    patch:
      summary: Pause or reactivate (toggles the Stripe promotion code)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                status: { type: string, enum: [active, paused] }
              required: [status]
      responses:
        '200':
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Affiliate' }

  /admin/affiliates/{code}/redemptions:
    parameters:
      - { name: code, in: path, required: true, schema: { type: string } }
      - { name: cursor, in: query, schema: { type: string } }
      - { name: limit, in: query, schema: { type: integer } }
    get:
      summary: Purchases attributed to this code
      responses:
        '200':
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AffiliateRedemptionPage' }

  /admin/affiliates/{code}/report:
    parameters:
      - { name: code, in: path, required: true, schema: { type: string } }
    post:
      summary: Render and send the monthly report to the influencer (Brevo)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                periodStart: { type: string, format: date } # inclusive
                periodEnd:   { type: string, format: date } # exclusive
              required: [periodStart, periodEnd]
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  sent: { type: boolean }

components:
  schemas:
    AffiliateStatus:
      type: string
      enum: [active, paused]
    Affiliate:
      type: object
      properties:
        id: { type: string }
        name: { type: string }
        email: { type: string, format: email }
        handle: { type: string }
        code: { type: string }
        discountPercent: { type: integer }
        commissionPercent: { type: integer }
        landingSlug: { type: string }
        status: { $ref: '#/components/schemas/AffiliateStatus' }
        createdAt: { type: string, format: date-time }
      required: [id, name, email, handle, code, discountPercent, commissionPercent, landingSlug, status, createdAt]
    CreateAffiliateInput:
      type: object
      properties:
        name: { type: string }
        email: { type: string, format: email }
        handle: { type: string }
        discountPercent: { type: integer }
        commissionPercent: { type: integer }
        code: { type: string }
        landingSlug: { type: string }
      required: [name, email, handle, discountPercent, commissionPercent]
    AffiliateRedemption:
      type: object
      properties:
        purchaseId: { type: string }
        ownerEmail: { type: string, format: email }
        priceId: { type: string }
        grossUsd: { type: number }
        discountUsd: { type: number }
        netUsd: { type: number }
        createdAt: { type: string, format: date-time }
      required: [purchaseId, ownerEmail, priceId, grossUsd, discountUsd, netUsd, createdAt]
    AffiliatePage:
      type: object
      properties:
        items: { type: array, items: { $ref: '#/components/schemas/Affiliate' } }
        nextCursor: { type: string, nullable: true }
      required: [items, nextCursor]
    AffiliateRedemptionPage:
      type: object
      properties:
        items: { type: array, items: { $ref: '#/components/schemas/AffiliateRedemption' } }
        nextCursor: { type: string, nullable: true }
      required: [items, nextCursor]
```

## 4. Data model (new tables)

```
affiliates
  id                  uuid pk
  name                text
  email               text
  handle              text
  code                text unique
  discount_percent    int
  commission_percent  int
  landing_slug        text unique
  stripe_coupon_id    text
  status              text          -- 'active' | 'paused'
  created_at          timestamptz

affiliate_redemptions  -- one row per attributed purchase (or a view over purchases)
  purchase_id         text pk
  affiliate_code      text fk -> affiliates.code
  owner_email         text
  price_id            text
  gross_usd           numeric
  discount_usd        numeric
  net_usd             numeric
  created_at          timestamptz
```

If you prefer, stamp `discount_code` + `discount_usd` on the existing
`purchases` row and expose `affiliate_redemptions` as a view. Admin only reads
the shape.

## 5. Stripe coupon + attribution (the core)

1. **On create:** make a Stripe coupon for `discount_percent` and a promotion
   code equal to `code` (uppercased). Store `stripe_coupon_id`. `PATCH` to
   `paused` sets the promotion code inactive so it stops redeeming.
2. **At Checkout:** the Website carries the code; BE attaches it to the Checkout
   session (`allow_promotion_codes` / `discounts`).
3. **In the webhook:** on `checkout.session.completed`, if the applied discount's
   promotion code matches an affiliate `code`, write the redemption (or stamp the
   purchase). `gross_usd` = amount before discount, `net_usd` = amount paid.

Without step 3 the reports show zero; everything else is plumbing around it.

## 6. Report math (so BE and Admin agree to the cent)

For a period `[periodStart, periodEnd)` (end exclusive), over redemptions whose
`created_at` date falls in the window:

```
grossRevenue   = sum(gross_usd)
discountGiven  = sum(discount_usd)
netRevenue     = sum(net_usd)
commissionOwed = round2(netRevenue * commission_percent / 100)
```

Commission is on **net** (post-discount) revenue, rounded to 2 dp. Admin's
`src/lib/affiliates/report.ts` is the unit-tested reference; mirror it. The email
body Admin previews is illustrative; BE owns what actually sends.

## 7. Audit

The `POST`/`PATCH` writes record the standard audit entry (actor, action,
target, before/after). Admin emits `affiliate.create`, `affiliate.status`,
`affiliate.report-send`; BE owns the canonical sink.

## 8. Definition of done

- The five endpoints return the documented shapes under admin auth.
- Creating an affiliate creates a usable Stripe promotion code; pausing disables
  it.
- A test purchase with the code lands as a redemption via the webhook.
- `POST .../report` emails the affiliate and is safe to re-send.
- Publish `@alkazat/contracts` with the additions and reply with the version so
  Admin re-pins and drops its local DTO stand-ins.
