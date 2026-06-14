# MCP change protocol (ADMIN view)

**Writing rule:** no em-dashes.

The BYO-AI MCP is a contract shared across BE, FE, and ADMIN. This protocol makes
sure any ADMIN change with MCP implications is caught and propagated. The
canonical copy lives in Yaycay-BE (`docs/handoff/MCP-CHANGE-PROTOCOL.md`); this is
the ADMIN view.

## Single source of truth

`@alkazat/contracts` exposes `MCP_TOOLS`, `CONNECTOR_DEFAULT_SCOPES`,
`MCP_OAUTH_SCOPES`, `TRIP_INTENT_FIELDS`, and `MCP_TABLES` from
`packages/contracts/src/mcp-surface.ts` (in Yaycay-BE). When ADMIN surfaces scope
names, tool names, or intent fields, **import them from the package** rather than
hardcoding. BE's `contracts:validate` step is the hard drift check.

## Why ADMIN is in scope

ADMIN shapes the context the MCP and the first-party AI operate in:

- **Prompts / model routing** (`src/app/(admin)/prompts`, `src/lib/prompts`) - the
  system prompts and model choices that frame planning and curation.
- **Content review** - what is allowed into the content model the assistant edits.
- **Connector / grant administration** - the "Connected assistants" management
  and revocation surface (consumes BE's unified `GET /connectors`).

A change to any of these can alter how the MCP behaves, so it is an MCP
implication even though the MCP endpoint itself lives in BE.

## What the guard catches

`.github/workflows/mcp-guard.yml` flags any PR touching the surfaces above, posts
the impact checklist, and stays red until acknowledged (the `mcp-impact: reviewed`
label or a ticked `- [x] MCP impact reviewed` in the PR description).

## Dimensions to review

Intent, Context, Data, Scopes, Tools, Auth, Cross-repo propagation, Stakeholders.
See the canonical protocol in Yaycay-BE for the full descriptions.
