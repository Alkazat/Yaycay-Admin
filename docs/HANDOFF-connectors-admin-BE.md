# Handoff to Yaycay-BE: admin surface for BYO-AI MCP connectors

> **STATUS: SHIPPED & LIVE (2026-06-16).** `GET /admin/connectors` + revoke are
> deployed, and the cross-cutting asks (log `plan_trip` to `ai_jobs` with
> `source=connector`; route connector content through Content Review) are
> closed. The "Connected assistants" screen runs against prod. Kept for history.

**From:** Yaycay-Admin thread. **For:** Yaycay-BE (contract owner).
**Context:** Yaycay-FE shipped an OAuth-protected MCP server (see
`08-MCP-CONNECTOR-HANDOFF.md`). Parents connect their own AI (Claude / ChatGPT /
Gemini), which then plans trips through the contract on their behalf. Admin owns
the **cross-account ops view**: see every connected assistant and revoke it.
**Status:** the Admin "Connected assistants" screen is built and stub-backed; it
goes live when the endpoints below exist and Admin re-pins `@alkazat/contracts`.

## 1. What Admin owns vs what FE owns

- **FE** owns parent **self-service** ("my connected assistants" in the account
  area) and the whole OAuth flow.
- **Admin** owns the **ops/support/security** view across all accounts: list,
  inspect, and **revoke** any grant. This is the incident-response kill switch.

Both act on the same underlying OAuth grants, so a revoke from either side must
be centrally effective (see section 4).

## 2. Contract additions (`@alkazat/contracts`)

Admin mirrors these locally in `src/lib/contracts/types.ts` (block "Pending
contract: BYO-AI MCP connectors") and swaps to the package on re-pin.

```ts
type ConnectorScope = 'yaycay.read' | 'yaycay.plan';
type ConnectorStatus = 'active' | 'revoked';

interface AdminConnector {
  id: string; // grant id, used to revoke
  userId: string;
  ownerEmail: string;
  assistant: string; // human label, e.g. "Claude (claude.ai)"
  clientId: string; // OAuth client id (RFC 7591 dynamic registration)
  scopes: ConnectorScope[];
  status: ConnectorStatus;
  createdAt: string;
  lastUsedAt: string | null; // last tool call on this grant
}
```

## 3. Endpoints (under the existing `/admin/*`: role=admin + AAL2, audited)

| Method + path                          | Returns                                   | Notes                                                                   |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `GET /admin/connectors?query=&cursor=` | `{ items: AdminConnector[], nextCursor }` | `query` filters by owner email / assistant. A view over `oauth_grants`. |
| `POST /admin/connectors/{id}/revoke`   | `AdminConnector` (status=revoked)         | Effective immediately (section 4).                                      |

These map 1:1 to `listConnectors` / `revokeConnector` in
`src/lib/data/index.ts`, which fail soft to stubs until live.

## 4. Revoke must actually cut access

Revoking a grant must, server-side:

1. mark the grant revoked,
2. invalidate its access + refresh tokens, and
3. ensure the next `/api/mcp` call with that grant fails auth.

A revoke that only flips a flag but leaves tokens valid is a security hole. The
FE's `verifyMcpToken` should reject revoked grants.

## 5. Two cross-cutting asks (these are the important ones)

### 5a. `plan_trip` writes must be observable in Admin

`plan_trip` mutates `trip_content` via an **external** model. Today Admin's Jobs
screen and the ~10/day cap only see our own `ai_jobs`. Please log every
connector-driven mutation as an `ai_jobs` row with a **source marker** so ops
can see and triage it, and so the cap applies:

```
ai_jobs.source: 'ours' | 'connector'   (new field)
ai_jobs.connectorId / assistant         (when source = connector)
```

Without this, BYO planning is invisible to ops and uncapped.

### 5b. Connector-generated content must still hit the review bar

Our guardrailed Sonnet output goes through Content Review before reaching a
family; an arbitrary external model has no such guardrail. Connector-driven
`trip_content` changes should route through the same `content-review` pipeline
(or at minimum be flagged for review). The Admin trip inspector's safety
roll-up is the backstop, but it should not be the only one.

## 6. Token storage (we back the safer option)

The FE doc offers two grant models. Admin/security endorses the **"mint a
dedicated scoped service token per grant, and do not stash the parent's Supabase
refresh token"** option. If user refresh tokens must be stored, they have to be
encrypted at rest, and the durable shared OAuth store is required before prod
(in-memory loses grants on redeploy).

## 7. Audit

`POST /admin/connectors/{id}/revoke` records the standard audit entry (actor,
action `connector.revoke`, target = grant id, before/after). Admin emits this
locally today; BE owns the canonical sink.

## 8. Definition of done

- The two endpoints return the documented shapes under admin auth.
- Revoke immediately stops the assistant's MCP access.
- `plan_trip` writes appear in `ai_jobs` with `source='connector'` and count
  against the cap.
- Connector content is reviewable.
- Publish `@alkazat/contracts` with the DTOs and reply with the version so Admin
  re-pins and drops its local stand-ins.
