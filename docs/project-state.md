# Atelier — Project State

Living source-of-truth briefing for anyone (or any tool, including v0)
building on Atelier. Keep this current as the project evolves — when something
ships, moves from stub to done, or a convention changes, update the relevant
section here.

_Last updated: 2026-05-17._

---

## Product

Atelier is custom-home / outdoor-living design software. A plain-language brief
becomes a sited floor plan, 3D massing, CAD/BIM exports, renders, and a client
portal that collects the deposit — so a contractor can design and close a job
in one visit.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 ·
Supabase (Postgres + Auth) · Stripe · Vitest. Deployed on Vercel.

## Architecture — key modules

- `lib/kernel/` — pure floor-plan engine. `generatePlan` (brief → `PlanGraph`),
  `adapt` (builder brief → kernel brief), `scene` (`PlanGraph` → 3D
  `SceneModel`), `codeCheck`. Deterministic, fully unit-tested, millimetre units.
- `lib/io/` — exporters: `dwg` (DXF), `ifc4` (IFC4 STEP-21), `gltf` (binary GLB).
- `lib/builder.ts`, `lib/design.ts` — brief-parsing models (keyword + AI paths).
- `lib/db/`, `lib/supabase*` — typed Supabase data layer.
- `lib/env/` — zod-validated environment access; `hasX` capability flags.
- `lib/stripe.ts` — Stripe client factory.
- `app/api/*` — route handlers: `parse-brief`, `builder/plan`, `checkout`,
  `stripe-webhook`, `gis/*`.
- `app/p/[slug]/[token]/` + `components/portal/` — the client portal.
- `app/builder/` + `components/builder/` — the multi-step builder flow.
- `app/admin/` — integration configuration dashboard.
- `components/sections/` — the marketing site (designed in v0).

## What's built and working

- Floor-plan kernel and all three exporters (DWG / IFC / GLB), unit-tested.
- Test suite: 204 Vitest tests; `npm run test:coverage`; kernel held to ≥80%.
- CI workflow (`typecheck → lint → test → build`) — see caveat below.
- Stripe deposit loop: `/api/checkout` creates a Checkout Session;
  `/api/stripe-webhook` verifies the signature and marks the project `funded`.
- `/admin` — shows which integrations are live and which env vars drive them.
- Supabase auth (email sign-in/up); both new (`sb_publishable_…`/`sb_secret_…`)
  and legacy (anon / service-role) key names are accepted.
- Marketing site — redesigned in v0 (the "enterprise" zinc theme).

## What's stubbed, blocked, or not done

- **The client portal is mock.** `/p/[slug]/[token]` themes a fake project from
  a hash of the URL — it reads no real data. De-mocking is two phases: the
  portal resolves a real project row (Phase 1), and the builder publishes a
  real project with pricing (Phase 2). Both are doable; both need a live DB.
- **No render pipeline.** The `renders` table exists but nothing generates
  photoreal images. `exportGLB` produces 3D massing, not renders. The portal
  currently shows decorative SVG art.
- **Documents** — no storage table; the portal's document list is mock.
- **`codeCheck` is early.** Avoid "permit-ready" claims — stamped construction
  documents come from licensed professionals; position Atelier as a tool that
  accelerates a pro.

## Conventions and constraints — read before contributing

- **Keyless-safe.** Every integration degrades gracefully when its env vars are
  absent. Never crash on missing configuration.
- **Accessibility.** Body/content text must clear WCAG AA contrast (4.5:1). The
  `--color-muted-2` theme token is tuned to pass AA on every app background —
  do not darken it, and do not use raw low-contrast grays for real content.
- **TypeScript strict.** `npm run typecheck` must pass. framer-motion easing
  arrays must be typed as `[number, number, number, number]`, never left to
  infer as `number[]`.
- Tests are colocated as `*.test.ts(x)`; `npm test` must stay green.
- Conventional commit messages.
- Never commit working files (reference screenshots, preview PNGs) to the repo.

## Recurring v0 integration issues

Each v0 push tends to re-introduce these — fix them on the v0 side if possible,
otherwise they get caught during reconciliation:

- Cubic-bezier easing constants left untyped (`number[]`) — break `tsc`.
- Reference / preview PNGs committed to the repo root — junk, must be removed.

## Setup (operator / deploy)

Environment variables (set in Vercel → Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — accounts.
- `SUPABASE_SECRET_KEY` — server-side database access (never expose).
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — deposit payments.
- `ANTHROPIC_API_KEY` — optional, enables AI brief parsing.

Also required: apply `supabase/migrations/`, configure the Supabase auth
redirect URLs, and create the Stripe webhook endpoint. `/admin` shows live
status. CI note: the GitHub Actions workflow exists but Actions appears
disabled on the repo, so it isn't gating merges yet.

## Branches and PRs

- `main` — base.
- **PR #47** (`claude/integrate-v0-marketing`) — current integrated truth: all
  logic / tests / infrastructure plus the v0 marketing redesign. Supersedes
  PR #44.

## Suggested next steps

1. De-mock the client portal (Phase 1 + 2) so it shows a real, funded project.
2. Enable GitHub Actions so CI actually gates merges.
3. Get a working contractor to run a real project through it — the proof
   needed before selling to an operator.
4. Build the render pipeline (larger effort).
