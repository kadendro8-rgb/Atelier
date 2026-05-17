# E2 — Marketing Worker

See `docs/factory.md` for factory rules and quality gates.

**Mission:** Give Atelier an enterprise-grade social presence — the calm,
premium, craft-forward register of a Lululemon or Alo — that posts
consistently and accurately across every platform, ships a weekly article,
and is wired for SEO, AEO, GEO, local schema, and paid ads.

> E2 is an **external** factory worker. Per `docs/factory.md`, the external
> wing comes online only when the 12 product quality bars are green for two
> consecutive weeks. The marketing **engine** below is tooling built ahead of
> that trigger so the worker can start producing on day one — it does not
> publish anything until the foreman wires live credentials.

**Owns:** `lib/marketing/`, `app/api/marketing/route.ts`,
`scripts/marketing-agent.mjs`, marketing JSON-LD on public pages, the blog
content pipeline.

## The engine

`lib/marketing/` is a brand-grounded content engine. Everything it produces is
anchored to one source of truth, `lib/marketing/brand.ts` — voice, content
pillars, audience, banned language, the local-business record, social handles.

| Module | Responsibility |
|---|---|
| `brand.ts` | Brand identity, voice, pillars, audience, business NAP record |
| `platforms.ts` | Per-platform limits, cadence, best times, formats |
| `agent.ts` | `MarketingAgent` — Claude-backed generation with bounded retry |
| `templates.ts` | Deterministic on-brand fallbacks (no API key required) |
| `calendar.ts` | Posting calendar + weekly article schedule planner |
| `seo.ts` | SEO / AEO / GEO metadata helpers |
| `schema.ts` | JSON-LD: LocalBusiness, Organization, Article, FAQ, Service |
| `queue.ts` | Publish queue + platform adapters (dry-run by default) |
| `prompts.ts` | Brand-grounded system prompts |

**Keyless-safe, like the rest of Atelier.** With no `ANTHROPIC_API_KEY` the
agent falls back to deterministic templates — the engine always returns valid,
on-brand artifacts. With the key set, generation upgrades to Claude.

**SEO / AEO / GEO.** `seo.ts` builds search metadata, a liftable answer
snippet (AEO), and area-served framing (GEO). `schema.ts` emits the JSON-LD
that lets search and answer engines read Atelier as a real local entity.

## Running the agent

```bash
npm run dev                                   # start the app
node scripts/marketing-agent.mjs plan --weeks 4   # full content plan
node scripts/marketing-agent.mjs posts --platform instagram --count 5
node scripts/marketing-agent.mjs article --topic "Siting a custom home"
node scripts/marketing-agent.mjs ads --platform facebook --objective leads
node scripts/marketing-agent.mjs schema
```

Artifacts are written to `marketing/out/` (git-ignored). Full flag list is in
the header of `scripts/marketing-agent.mjs`.

**Done means:**
- Calendar + posts + article + ads + schema all generate without an API key.
- Every artifact passes the brand voice rules (no banned language).
- Articles ship with FAQ schema and an AEO answer paragraph.
- The publish queue runs end-to-end in dry-run mode.

## Access & deployment

The studio (`/marketing`) and its API (`/api/marketing`) are an **internal
tool**, not a public product surface:

- **Auth gate** — restricted to `admin` / `staff` profiles
  (`lib/marketing/access.ts`). A server component gates the route before the
  studio renders; the API returns 401/403 for everyone else.
- **Rate limit** — `/api/marketing` is rate-limited per client
  (`lib/marketing/rateLimit.ts`) to bound abuse and Anthropic spend.
- **Not indexed** — `app/marketing/layout.tsx` sets `robots: noindex`, and the
  route is not linked from the main navigation.
- **Keyless-safe** — with no Supabase auth configured (local dev) the gate is
  open; production always has Supabase configured, so the gate is enforced.

For a production deploy the foreman sets `ANTHROPIC_API_KEY` (generation) and
the Supabase env vars (the auth gate) in Vercel; both are listed in
`.env.example`.

## Backlog

1. Add live `PublishAdapter` implementations per platform in `lib/marketing/`
   (Meta Graph API, X API, LinkedIn API, TikTok/Pinterest/YouTube).
2. Persist the publish queue (Supabase table `marketing_jobs`) so scheduling
   survives a process restart.
3. Move the API rate limiter to a shared store (Vercel KV / Upstash) so the
   limit holds across serverless instances.
4. Render `localBusinessSchema()` / `organizationSchema()` site-wide in the
   root layout; `articleSchema()` + `faqSchema()` on each blog post.
5. Build the `/blog` route that publishes generated articles.
6. A scheduled trigger (cron) that calls `/api/marketing` and drains the queue.

## Foreman tasks (a coding agent cannot do these)

- **Confirm the business NAP** in `brand.ts` `BUSINESS` — the address, phone,
  and geo are placeholders. Local schema and GEO citations must use the real
  registered studio details.
- **Create the platform accounts** and confirm the handles in
  `SOCIAL_HANDLES`.
- **Provision API credentials** for each platform and add them to the
  environment (see the marketing section of `.env.example`). Until then the
  publish queue stays in dry-run.
- **Review the first batch** of generated content before anything is wired to
  publish — the engine is accurate, but a human signs off on brand.
