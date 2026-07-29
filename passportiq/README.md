# PassportIQ (working name)

Privacy-first personal financial passport. **Pre-release development software — Milestone 1 in
progress.** Nothing here is verified, certified, audited, or compliant with anything, and the app
never claims otherwise. All demo data is clearly labeled demo data.

## Status

- ✅ Planning docs complete — see `docs/00`–`09`
- ✅ Prisma schema, config foundation, design tokens
- ⏳ Application code (auth, calc engine, dashboard, tests) — **blocked in the remote build
  environment**: its network allowlist denies `registry.npmjs.org`, so dependencies cannot be
  installed there yet. See `docs/07-INTEGRATIONS.md` (environment note). Local dev is unaffected.

## Stack

Next.js (App Router) · TypeScript strict · Tailwind v4 · Prisma · PostgreSQL · Vitest · Playwright.
Modular monolith; domain logic in `src/modules/*`. See `docs/02-ARCHITECTURE.md`.

## Run (local)

```bash
cd passportiq
cp .env.example .env          # every variable is documented in the template
docker compose up -d db       # Postgres 16 on :5432
npm install
npm run db:migrate            # prisma migrate dev
npm run db:seed               # seeds demo user Jordan Carter (placeholder dataset)
npm run dev                   # http://localhost:3000
```

Demo login: `jordan.carter@example.com` / value of `SEED_DEMO_PASSWORD` in your `.env`.

## Scripts

| Script | What it does |
|---|---|
| `npm run verify` | typecheck + lint + unit/integration tests |
| `npm run test` / `test:e2e` | Vitest / Playwright smoke |
| `npm run db:migrate` / `db:seed` | migrations / demo seed (refuses in production) |

## Honest limits (Milestone 1)

- All financial data is **self-reported or estimated** — the app never marks anything "verified".
- No bank connections exist. Account aggregation is deferred; when a mock arrives in Milestone 2 it
  is labeled MOCK in code and DEMO in the UI.
- MFA/passkeys, rate limiting, field-level encryption: deferred — see `docs/04-SECURITY-MODEL.md`.
- The Jordan Carter dataset is an invented placeholder pending the real spec §16.
