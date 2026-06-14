# Handoff to Yaycay-Website (and FE): affiliate landing page

**From:** Yaycay-Admin thread. **For:** Yaycay-Website (funnel), with one FE/BE
note on Checkout.
**Depends on:** the BE work in `HANDOFF-affiliate-program-BE.md` (the affiliate
record, its `landingSlug`, and the Stripe promotion code).

## What you build

A public affiliate landing page at **`/go/<slug>`** that an influencer links to
from their bio or video. It captures the click, carries the discount, and sends
the visitor into the normal funnel with the code pre-applied. Nothing here is
gated; it is a marketing page.

`<slug>` is the affiliate's `landingSlug` (Admin creates it; e.g.
`/go/sunnytravels`). The matching code (e.g. `SUNNY15`) is what gets applied at
Checkout.

## Behaviour

1. **Resolve the slug.** On `/go/<slug>`, look up the affiliate (a small public
   read BE can expose, e.g. `GET /affiliates/by-slug/<slug>` returning
   `{ code, discountPercent, name, status }`, or bake a slug -> code map at build
   if the list is small). If the affiliate is missing or `paused`, fall back to
   the normal homepage with no code.
2. **Set the code.** Persist the resolved `code` (cookie or query carried through
   signup, e.g. `?ref=SUNNY15`) so it survives the demo signup and reaches
   Checkout. Respect the existing consent/cookie posture.
3. **Show the offer.** Headline the discount ("15% off your Yaycay holiday with
   Sunny Travels"). Reuse the design system; tagline fixed ("For families making
   memories."). No em-dashes in copy.
4. **Into the funnel.** CTA goes to the standard free-demo signup, with the code
   attached. The demo, account capture and Brevo sync are unchanged.

## Checkout (FE/BE touch point)

When the buyer reaches Stripe Checkout, the carried `code` must be applied so the
Stripe promotion code discounts the order and the webhook can attribute it:

- The Checkout session is created by BE (per the model context). Pass the code
  through to the create-session call; BE attaches it as the promotion code /
  `discounts` and enables `allow_promotion_codes`.
- If the code is missing or invalid, Checkout proceeds at full price. Never block
  a sale on a bad code.

Attribution (writing the redemption row) happens entirely in the BE webhook from
the Stripe promotion code; the Website only needs to make sure the code rides
along from `/go/<slug>` to the Checkout session.

## Why it matters

The revenue and commission Admin reports back to each influencer are only as good
as this attribution chain. If the code does not survive from the landing page to
the Stripe session, the influencer's report shows zero and we cannot pay them.

## Definition of done

- `/go/<slug>` resolves a live affiliate, shows the discount, and degrades to the
  homepage for an unknown or paused slug.
- The code survives signup and is applied at Checkout.
- A completed test purchase from `/go/<slug>` appears as a redemption under that
  affiliate in Admin.
