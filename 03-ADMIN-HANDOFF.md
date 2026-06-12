# Yaycay Admin - Handoff

**Repo:** `github.com/Alkazat/Yaycay-Admin`
**Read `00-MODEL-CONTEXT.md` first.** This thread is an **admin-scoped consumer** of the BE contract. Its job is to **troubleshoot and improve** the live product, safely.

---

## Mission

An internal ops console to (1) **improve** the live experience - edit and version prompts, pick the model per task, tune behaviour without shipping code - and (2) **troubleshoot** - see what a customer is doing, where an ingestion or chat failed, where a journey stalled, and fix it.

## Non-negotiable security posture

- **Off-domain:** its own domain (not a guessable subdomain of the product).
- **MFA mandatory from day one** for every admin; same isolated identity store and `admin` role as the rest of the platform.
- Admin-scoped API only (`/admin/*`); all actions audited. No customer ever reaches this app.

## Scope

**In:** prompt CRUD + versioning; model selection per task (Claude/Gemini/OpenAI, default Sonnet); customer + trip inspection (read trip_content, profiles, jobs); ingestion/chat failure triage + retry; content review/publish for generated trips; product/price + purchase visibility (source of truth stays in Stripe); `ai_jobs` and daily-cap monitoring.

**Out:** customer UI (FE); the API/data/AI execution (BE); marketing site (Website). Admin does not run inference itself - it configures what BE runs.

## Stack

- TypeScript, **Next.js** (or **Refine** for fast CRUD screens), on **Vercel** (separate project + off-domain).
- Design system (admin can be denser, but same tokens/components/fonts).
- `@alkazat/contracts` (admin DTOs); Supabase admin client against the same DB.

## Screens

| Screen | Purpose |
|---|---|
| Prompts | List/edit/version prompts; set the model per task; diff versions; activate |
| Models | Available models + routing defaults; per-task overrides |
| Trips | Search a customer/trip; inspect `trip_content`, profiles, progress |
| Jobs | `ai_jobs` stream: generation/ingestion/chat; failures; retry; cap usage |
| Content review | Approve/edit AI-generated content before publish (quality bar) |
| Commerce | Products/prices + purchases (read-mostly; Stripe is source of truth) |
| Customers | Account lookup, entitlement, retention status, data-deletion requests |

## Environment

```
NEXT_PUBLIC_API_BASE=                 # BE admin endpoints
ADMIN_SUPABASE_URL= / ADMIN_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=                 # admin.yaycay-ops.* (off-domain)
```

## Build checklist (mostly Phase 2)

- [ ] Off-domain deploy + MFA gate + `admin` role check on every route.
- [ ] Prompts CRUD + versioning + model selection (writes `prompts`).
- [ ] Jobs monitor + failure retry; cap usage view.
- [ ] Trip/customer inspector (read-only by default; explicit edit with audit).
- [ ] Content review/publish flow.
- [ ] Commerce + retention/deletion-request handling.

## Testing & CI

- Vitest (role guards, prompt-versioning logic).
- Playwright E2E behind a test admin + MFA; assert non-admins are refused; touch hard-rules still apply.
- `develop` → staging, `main` → production (separate Vercel project + off-domain); smoke test asserts the MFA gate and an authed admin read.

## Definition of done

An admin can log in (MFA), change a prompt or model and see it take effect live, watch and retry jobs, inspect any trip to troubleshoot, and review/publish content - all off-domain, audited, and green on `main`.

## Handshake

- Consume the admin-scoped contract from BE; request new admin endpoints via a PR on `Yaycay-BE`. Day one, Supabase Studio (MFA-capable) covers raw data ops while these screens are built.
