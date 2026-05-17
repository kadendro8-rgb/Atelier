# Atelier — Go-Live Checklist

The exact, ordered steps to take Atelier from "runs keyless" to "fully
live." Every step here is a **foreman task** — it touches the Supabase,
Vercel, and Stripe dashboards, which the build agents cannot reach.

## How Atelier behaves without any of this

Atelier is built keyless-first. With **nothing** configured it still
runs: the builder is open to everyone, the design brief is parsed
on-device, and the lot flow degrades gracefully. The steps below turn on
the three things that need real credentials:

| Capability | Needs |
|---|---|
| AI brief parsing (Claude) | `ANTHROPIC_API_KEY` |
| Accounts, saved projects, the portal | Supabase (migrations + keys) |
| Deposits | Stripe (keys + webhook) |

Do the steps **in order** — env vars depend on the database existing,
and the webhook depends on the deployment existing.

---

## Step 1 — Apply the Supabase migrations

In the Supabase project, run the migrations in `supabase/migrations/`
**in timestamp order**:

1. `20260516120000_create_leads.sql`
2. `20260516130000_v2_core_schema.sql`
3. `20260516140000_projects_meta.sql`
4. `20260517010000_profiles_trigger.sql`
5. `20260517020000_project_type.sql`

Apply them with the Supabase CLI (`supabase db push`) or by pasting each
file, in order, into the SQL Editor. After this, the `leads`, `projects`,
`profiles`, plan-graph, and GMV-event tables exist.

## Step 2 — Set environment variables in Vercel

Set these in **Vercel → Project → Settings → Environment Variables**
(Production, and Preview if you want previews fully live). If the
Supabase integration is connected in Vercel, the `SUPABASE_*` and
`NEXT_PUBLIC_SUPABASE_*` values may be injected automatically — verify
they are present.

| Variable | Scope | Where it comes from |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server | console.anthropic.com → API keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase → Settings → API → `anon` `public` key |
| `SUPABASE_URL` | Server | Same Project URL as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase → Settings → API → `service_role` key |
| `STRIPE_SECRET_KEY` | Server | Stripe → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Server | Produced in Step 4 — set this last |

Rules:
- The `service_role` key and `STRIPE_SECRET_KEY` are **server-only** —
  never prefix them with `NEXT_PUBLIC_`, never paste them in chat.
- Only the two `NEXT_PUBLIC_SUPABASE_*` values are safe for the browser.
- Note: `.env.example` currently lists only `ANTHROPIC_API_KEY`,
  `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. The four other
  variables above are also required for full functionality — treat this
  table as the source of truth.

## Step 3 — Configure Supabase Auth redirect URLs

In **Supabase → Authentication → URL Configuration**:

- **Site URL:** the production domain (e.g. `https://atelier.design`).
- **Redirect URLs:** add the auth callback for every environment that
  needs login — `https://<your-domain>/auth/callback`, plus the Vercel
  preview pattern if previews should support login.

Without this, magic-link / OAuth sign-in will reject the redirect.

## Step 4 — Register the Stripe webhook

1. Deploy once (Step 5) so the endpoint exists, **or** use a known
   production URL.
2. In **Stripe → Developers → Webhooks → Add endpoint**, set the URL to:
   `https://<your-domain>/api/stripe/webhook`
3. Subscribe to the event: **`checkout.session.completed`**.
   (The handler marks the project `funded` and logs a `deposit` GMV
   event; other event types are acknowledged and ignored.)
4. Copy the endpoint's **Signing secret** (`whsec_…`) into the
   `STRIPE_WEBHOOK_SECRET` env var from Step 2, then redeploy.

The webhook route verifies every event against this secret; if it is
missing or wrong, deposit events return `400` and are never processed —
so this secret must be correct before deposits can complete.

## Step 5 — Deploy and verify

1. Trigger a Production deploy in Vercel (push to the production branch,
   or redeploy after setting env vars — **env-var changes require a
   redeploy to take effect**).
2. Confirm the build succeeds and the production domain resolves.

### Smoke test (production)

- [ ] Home page loads; the hero builder entry works.
- [ ] `/builder` runs lot → brief → layout keyless (no login needed).
- [ ] AI brief parsing returns a structured result (confirms
      `ANTHROPIC_API_KEY`).
- [ ] Sign-up / login completes and redirects cleanly (confirms Supabase
      keys + Step 3 redirect URLs).
- [ ] A signed-in project saves and reloads (confirms migrations +
      service-role key).
- [ ] A test deposit via the client portal completes, and the project
      flips to `funded` shortly after (confirms Stripe keys + the Step 4
      webhook). Use Stripe **test mode** keys for this, then switch to
      live keys when ready.

---

## Notes

- Keep a test-mode and a live-mode Stripe configuration separate; the
  webhook secret differs between them.
- There is an external GitHub `build` check that fails on every commit
  regardless of repository state — it is org-side and not a blocker for
  deployment.
- Re-run the smoke test after any env-var change, since a redeploy is
  required for changes to land.
