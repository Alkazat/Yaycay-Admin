# Deploying Yaycay Admin

Yaycay Admin is a Next.js (App Router) app that deploys to **Vercel** as its own
project, off-domain and MFA-gated. It builds and runs today on the local stub
data layer, so it can be hosted before the BE contract lands; real data wiring
follows once `@yaycay/contracts` v0.2 is published.

## Hosting: Vercel (separate project)

1. In Vercel, **New Project** -> import `Alkazat/Yaycay-Admin`. Keep it separate
   from the FE and Website projects.
2. Framework preset auto-detects as **Next.js**. Build command `next build`,
   install `npm install` (the lockfile-based `npm ci` once `package-lock.json`
   is committed via a direct push). No root-directory override.
3. `vercel.json` pins the region to `syd1` (Sydney) and enables deploys for
   `main` and `develop`.

## Branches and environments

| Branch    | Vercel environment | URL                                    |
| --------- | ------------------ | -------------------------------------- |
| `main`    | Production         | the off-domain production URL          |
| `develop` | Preview (staging)  | `staging.*` or the private preview URL |

Set the **Production Branch** to `main` in Project Settings -> Git. Pushes to
`develop` produce staging deploys; pushes to `main` produce production.

## Domain: off-domain (not a yaycay.ai subdomain)

The security posture requires its own domain, not a guessable product
subdomain. Attach a distinct apex you own, for example:

- Production: `admin.yaycay-ops.com`
- Staging: `staging.yaycay-ops.com` (or keep the `*.vercel.app` preview private)

Do NOT use `admin.yaycay.ai` or any `*.yaycay.ai` host. Set
`NEXT_PUBLIC_SITE_URL` to the attached domain in each environment.

## Environment variables (Project Settings -> Environment Variables)

Set these per environment (Production and Preview). Source of truth is
`.env.example`.

| Variable                        | Scope  | Notes                                              |
| ------------------------------- | ------ | -------------------------------------------------- |
| `ADMIN_SUPABASE_URL`            | server | Admin Supabase project URL                         |
| `ADMIN_SERVICE_ROLE_KEY`        | server | Service-role key. Server-only, never exposed       |
| `NEXT_PUBLIC_SUPABASE_URL`      | public | Browser auth client                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Browser auth client                                |
| `NEXT_PUBLIC_API_BASE`          | public | BE `/admin/*` base URL                             |
| `NEXT_PUBLIC_SITE_URL`          | public | The off-domain admin URL                           |
| `ADMIN_DEV_BYPASS`              | server | MUST be unset or `false` in staging and production |

When the Supabase/BE values are absent the app serves stub data and (with
`ADMIN_DEV_BYPASS=true`) a stub admin session. Both are for local development
only; never enable the bypass on a deployed environment.

## Lock it down

- **Vercel Deployment Protection**: enable Vercel Authentication (or password)
  on the project, in addition to the app's own MFA gate. Defense in depth.
- The app already sends `noindex`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer` (see
  `next.config.mjs`).
- Keep the project private; do not link it from any customer-facing surface.

## Smoke test

After each deploy, hit `GET /api/health` -> `{ "status": "ok", ... }`. The MFA
gate covers the authed-read assertion: an unauthenticated request to any
`/admin` route redirects to `/login`.

## Caveat: stub persistence

The dev in-memory store (`src/lib/data/store.ts`) is process-local. On
serverless it does not persist across instances or cold starts, so stub writes
(prompt versions, audit entries, deletion flags) are not durable on a deployed
preview. This is fine for a click-through demo; durable state arrives when
BE/Supabase is wired. Reads, navigation, and the MFA gate all work as deployed.
