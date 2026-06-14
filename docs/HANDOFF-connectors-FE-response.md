# Response to Yaycay-FE: MCP connector + OAuth handoff

**From:** Yaycay-Admin thread. **For:** Yaycay-FE.
**Re:** `08-MCP-CONNECTOR-HANDOFF.md`.

Thanks - the OAuth/MCP flow looks solid. Answers to your open questions from the
admin/ops side, plus one product-safety ask that needs your tool layer.

## Ownership split (your "Connected assistants management UI" offer)

There are two surfaces, and they are different:

- **Parent self-service** - "my connected assistants", in the parent's account
  area. **You own this.** Build it when you like; `GET /connectors` +
  `ConnectorStatus` is the right backing.
- **Ops/admin cross-account view** - list + revoke any account's connector for
  support and security. **Admin owns this**, via a new admin-scoped
  `GET /admin/connectors` + `POST /admin/connectors/{id}/revoke` (raised with BE
  in `HANDOFF-connectors-admin-BE.md`). The Admin screen is already built and
  stub-backed.

The only coupling we need: a revoke from either surface must be **centrally
effective** - `verifyMcpToken` rejects a revoked grant immediately.

## Your question #3 (auth model vs `/connectors/byo-ai`)

From the ops view we do **not** need per-trip tokens. Account-scoped OAuth as
the primary path (your recommendation) is fine. Keep `/connectors/byo-ai` as the
power-user static-token alternative if you like, as long as both kinds of grant
are listed and revocable through the admin surface above.

## The one important ask: make `plan_trip` observable + reviewable

`plan_trip` lets an external model write `trip_content`. Two consequences ops
cares about:

1. **Logging** - each `plan_trip` mutation should produce an `ai_jobs` row
   marked `source='connector'` (BE change we requested), so it shows in Admin
   Jobs and counts against the daily cap. Otherwise BYO planning is invisible
   and uncapped.
2. **Review** - our own AI output passes Content Review before a family sees it.
   An external model has no guardrail, so connector-written content should go
   through the same review bar (or be flagged). This is a child-safety point,
   not a nicety.

Mostly BE work, but it touches how your `plan_trip` tool calls the contract, so
flagging it here too.

## Token security

We back your **preferred** option: mint a dedicated scoped service token per
grant and do not stash the parent's Supabase refresh token. If you must store
it, encrypt at rest, and ship the durable shared OAuth store before prod.

## Scopes + revocation

Coarse scopes (`yaycay.read`, `yaycay.plan`) are fine for now. We surface
`plan` as a "can write" flag in the admin list. No new vocabulary needed yet;
the priority is that revoke cuts access immediately.

## What Admin shipped against this

A "Connected assistants" screen: per-account list (assistant, scopes, last
used, status), a roll-up (active / can-write / stale / revoked), search by
email or assistant, and a revoke kill switch. Stub-backed now; live the moment
`GET /admin/connectors` exists.
