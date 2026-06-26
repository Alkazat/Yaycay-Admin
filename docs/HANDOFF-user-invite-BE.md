# Handoff to Yaycay-BE: invite / onboard a customer from Admin

**From:** Yaycay-Admin thread. **For:** Yaycay-BE (contract owner).

> **STATUS (2026-06-26): endpoint LIVE, one DTO still to publish.**
> `POST /admin/customers/invite` shipped (BE CI green) and Admin's "Invite a
> user" button works against it. **The only open item:** `@alkazat/contracts`
> `0.32.0` does NOT export `InviteCustomerInput`, so Admin still carries a local
> stand-in for that body type. **Ask: publish `InviteCustomerInput` in the next
> contract bump** (shape below, unchanged) - Admin drops its stand-in the moment
> it lands. Nothing else is blocking. The rest of this doc is the original spec,
> kept for reference.

## Why an invite (not a create-with-password)

Identity is the isolated store (model context section 4/6): Supabase Auth,
email magic-link **plus a mandatory 2FA code**, no passwords stored. So an admin
cannot (and must not) set a customer's credentials. Manual onboarding =
**invite**: provision a pending account, email a magic-link, the person finishes
setup (2FA) on first sign-in.

## Endpoint - `POST /admin/customers/invite`

Under the existing `/admin/*` surface (role=admin + AAL2, audited).

Body (`InviteCustomerInput`, mirrors the Admin stand-in):

```ts
interface InviteCustomerInput {
  email: string;
  name?: string; // optional, to greet them in the invite email
}
```

Returns the new `CustomerSummary` (201) - `tier: null`, `retentionExpiresAt:
null`, `deletionRequested: false` for a fresh account.

Behaviour:
1. Provision an account in the isolated identity store in a **pending** state
   (no password; awaiting first magic-link sign-in).
2. Send the **magic-link invite** email via the transactional sender, greeting
   them by `name` if given. (Reuse the existing magic-link/2FA flow.)
3. Create the `marketing_contacts` row + Brevo sync with consent state, like a
   normal signup.
4. **Idempotency:** if the email already has an account, return it (200) rather
   than erroring or duplicating - re-inviting should resend the link, not 409.
5. Audit the action (Admin also records `customer.invite` locally).

## Contract + done

- Publish `InviteCustomerInput` in `@alkazat/contracts`; Admin drops its local
  stand-in on the next bump.
- Done when: `POST /admin/customers/invite` provisions a pending account, sends
  the magic link, the invited person can complete sign-in + 2FA, and they then
  appear in `GET /admin/customers`.

## Optional later
- An invite/pending **status** on `CustomerSummary` (e.g. `invitedAt` /
  `pending: boolean`) so the Users list can show "invited, not yet signed in".
  Not required for the first cut.
