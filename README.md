# Atelier

Custom-home design software — a conversation becomes permit-ready plans, site
plans, photoreal renders, and a client portal that collects the deposit.

Next.js 15 · React 19 · TypeScript · Tailwind v4 · Supabase.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest test suite |
| `npm run test:coverage` | Vitest with a coverage report |

## Authentication setup (Supabase)

Auth is optional — with no Supabase env vars the site runs fully and the
builder is open to everyone. To enable accounts, set the Supabase env vars
**and** configure the redirect URLs in the Supabase dashboard.

Email sign-up sends a confirmation link. The app asks Supabase to return the
user to `${window.location.origin}/auth/callback`, but **Supabase only honors
that redirect if the URL is allowlisted** — otherwise it falls back to the
project's *Site URL*, which defaults to `http://localhost:3000`. A confirmation
email that opens `localhost` on a phone or a deployed site means the
allowlist is missing your real URL.

In the Supabase dashboard, under **Authentication → URL Configuration**:

- **Site URL** — your production URL, e.g. `https://atelier.vercel.app`.
- **Redirect URLs** — add one `/auth/callback` entry per origin:
  - `https://atelier.vercel.app/auth/callback` — production
  - `https://*.vercel.app/auth/callback` — Vercel preview deployments
  - `http://localhost:3000/auth/callback` — local dev

After changing these, request a fresh confirmation email — links generated
before the change keep the old redirect. For local testing you can also turn
off **Authentication → Providers → Email → Confirm email**, which makes
sign-up log in immediately with no email step.

## Deposit payments (Stripe)

The client portal (`/p/{slug}/{token}`) collects a design deposit through
Stripe Checkout. Payments are optional — with no Stripe env vars the portal
runs a non-charging demo flow.

To enable real payments, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
(see `.env.example`) and create a webhook in the Stripe dashboard:

1. **Developers → Webhooks → Add endpoint** — point it at
   `https://<your-domain>/api/stripe-webhook`.
2. Subscribe to the **`checkout.session.completed`** event.
3. Copy the endpoint's **Signing secret** (`whsec_…`) into
   `STRIPE_WEBHOOK_SECRET`.

Use **test-mode** keys (`sk_test_…`) while developing — Stripe's
[test cards](https://stripe.com/docs/testing) run the full loop with no real
money. For local webhook delivery, run `stripe listen --forward-to
localhost:3000/api/stripe-webhook` ([Stripe CLI](https://stripe.com/docs/stripe-cli)).

The deposit amount is read from the project's `deposit_cents` column when a
real project matches the portal link; otherwise it falls back to the demo
amount. A successful payment flips the project's status to `funded` via the
webhook.

## Factory

Atelier is built by a disciplined agent "factory" — six specialist workers,
strict quality gates, the product made excellent before the external
(sales/marketing) wing comes online. See [`docs/factory.md`](docs/factory.md)
and the per-worker specs in [`docs/factory/`](docs/factory/).

The v2.0 product spec is [`docs/v2-spec.md`](docs/v2-spec.md); live build status
is tracked in [`docs/v2-command-center.md`](docs/v2-command-center.md) and
[`docs/v2-roadmap.md`](docs/v2-roadmap.md).
