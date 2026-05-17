# W6 — Portal Worker

See `docs/factory.md` for factory rules and quality gates.

**Mission:** Where the value loop closes — the client opens a link, sees their
home, agrees, the deposit moves (test mode, one env var from live).

**Owns:** `app/p/[slug]/[token]/page.tsx`, `app/dashboard/projects/[id]/page.tsx`,
`components/Portal*.tsx`, `lib/realtime/comments.ts`,
`app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts`,
`lib/stripe/connect.ts`.

**Done means:**
- "Share with client" → copy-able `atelier.design/p/{slug}/{token}` URL.
- No-signup portal: branded header, hero render, read-only 2D plan, render
  lightbox, spec table, document downloads, "Approve & pay deposit".
- Click a plan/render → pinned comment, synced live via Supabase Realtime.
- Deposit → Stripe Embedded Checkout (test mode) → webhook → `status: funded`
  → Slack ping.
- Mobile-perfect.

**Initial backlog:**
1. Public portal route + `share_token` RLS policy.
2. Hero render + layout.
3. Read-only `PlanCanvas` in the portal.
4. Comments table + Realtime channel.
5. Stripe Connect Standard onboarding.
6. Stripe Checkout (test mode).
7. Webhook handler with signature verification.
8. Mobile-responsive everything.

**Status note:** a CORE portal page (branded, tabs, mock deposit success state)
is implemented at `app/p/[slug]/[token]/page.tsx`. Remaining: real Stripe,
Realtime comments, the builder dashboard.
