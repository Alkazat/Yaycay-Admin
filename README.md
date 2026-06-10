# Yaycay Admin

Internal ops console for Yaycay, the family holiday companion. Admins use it to
improve the live product (edit and version prompts, pick the model per task)
and to troubleshoot (inspect trips and jobs, retry failures, review and publish
generated content).

Read `00-MODEL-CONTEXT.md` first. This app is an **admin-scoped consumer** of
the BE contract. It never runs inference itself; it configures what BE runs.

## Security posture (non-negotiable)

- **Off-domain:** its own domain, never a guessable product subdomain.
- **MFA mandatory from day one** for every admin. Every protected route runs
  `requireAdmin()` server-side, which requires the `admin` role AND verified
  MFA. A coarse edge gate (`src/middleware.ts`) bounces unauthenticated traffic
  first; the server check is authoritative.
- **No customer ever reaches this app.** Responses are `noindex`, framing is
  denied, and the admin Supabase service-role client is server-only.

## Stack

- Next.js (App Router) + TypeScript on Node 20, deployed on Vercel as a
  separate, off-domain project.
- Supabase admin client against the same DB (server-only, service-role).
- `@alkazat/contracts` for admin DTOs. Until that package is wired in, local
  stand-ins live in `src/lib/contracts/types.ts` and must not diverge from the
  published contract.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in, or leave blank to use stubs
npm run dev
```

When Supabase / BE env values are absent, the app serves a local **stub data
layer** (`src/lib/data/stubs.ts`) so every screen is navigable. To sign in
without a live identity store during development, set `ADMIN_DEV_BYPASS=true`
(dev only; it is ignored in production).

## Screens

| Route                       | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `/`                         | Dashboard: counts and stub-mode notice             |
| `/prompts`                  | List/version prompts; model per task               |
| `/models`                   | Models and routing defaults                        |
| `/trips`, `/trips/[tripId]` | Trip search and read-only `trip_content` inspector |
| `/jobs`                     | `ai_jobs` stream; failures; cap usage              |
| `/content-review`           | Approve/edit generated content before publish      |
| `/commerce`                 | Products/prices (Stripe is source of truth)        |
| `/customers`                | Entitlement, retention, audited deletion requests  |
| `/audit`                    | Admin audit trail: actor, action, target, when     |

## Testing

- `npm run typecheck` - TypeScript, no emit.
- `npm run lint` - ESLint (Next config).
- `npm run test` - Vitest unit tests (the access guard is covered).
- `npm run test:e2e` - Playwright at phone/tablet/desktop viewports; asserts the
  MFA gate refuses unauthenticated visitors and the health endpoint stays
  public.

## CI/CD

`develop` -> staging, `main` -> production (separate Vercel project, off-domain).
CI runs typecheck, lint, unit tests, build and E2E. The deploy smoke test hits
`/api/health` and asserts the gate.

See `docs/DEPLOY.md` for the full Vercel + domain + env setup.

## What is stubbed (foundation pass)

This is the scaffold + foundation. The structure, auth gate, design tokens,
data-layer boundary and CI are in place; the real Supabase/BE wiring and the
write flows (prompt edit/version, job retry, content publish) drop into the
clearly marked `notWiredYet` accessors in `src/lib/data` and the auth calls in
`src/lib/auth/session.ts`.

> Writing rule (all docs and copy): no em-dashes; use hyphens, commas, or
> rewrite.
