# Atelier v2.0 — Ship the category-leading version

> This is the canonical v2.0 specification. Every section-owning agent or
> contributor should read this doc and `docs/v2-roadmap.md` before starting.

You are the principal engineer on Atelier. v1.1 shipped the landing page and
the basic builder loop. v2.0 is the version that makes Atelier the best
custom-home design platform on the planet.

## North Star

Every design decision passes the three-legged stool:

1. **Great for the consumer (the builder)** — fair pricing, owns files, works
   offline, no AI training on their work, no telemetry beyond aggregate
   analytics.
2. **Great for the maker (us)** — sustainable margins, defensible without
   lock-in.
3. **Doesn't harm the company** — we don't sell scraps, we don't race to the
   bottom.

If any decision fails any leg, comment `// THREE-LEG-VIOLATION:` with the
reason and pick the version that passes.

## Visual identity (locked tokens)

```ts
{
  bg: '#0b0a09',
  surface: '#141414',
  surfaceElevated: '#1a1817',
  border: '#262626',
  borderSubtle: '#1f1d1c',
  accent: '#C8956D',          // copper, primary CTA, success, brand
  accentHover: '#B8855D',
  accentMuted: '#E0B89A',     // pending states
  text: '#F4F0E8',
  textMuted: '#8A857C',
  textDim: '#5a5550',
  success: '#9AB87A',
  warning: '#D4A24C',
  danger: '#C25B5B',
}
```

Font: Inter for UI, Fraunces for the hero H1 only. Both via `next/font/google`.
Spacing on a 4-pt rhythm. Radius `rounded-lg` default, `rounded-xl` cards,
`rounded-2xl` hero canvas. Every state change animates (200ms ease hovers,
400ms cubic-bezier(0.32,0.72,0,1) page transitions, 600ms spring reveals);
respect `prefers-reduced-motion`.

> NOTE: the live repo's Tailwind theme already uses semantic token names
> (`ink`, `surface`, `copper`, `foreground`, `muted`, `border`). New code
> should use those existing classes rather than re-declaring raw hex.

## Section 1 — Real floor-plan engine

### 1.1 Plan generation kernel — `lib/kernel/plan.ts`
`generatePlan(brief: ParsedBrief): PlanGraph` takes the parsed brief and
returns a graph of rooms, walls, doors, windows, openings. Algorithm:
constraint-based room packing. Place public spaces along the south/view side,
private along the back, service toward the front. Deterministic per seed.

### 1.2 SVG renderer — `components/PlanCanvas.tsx`
Inline SVG. Walls as thick strokes (6px exterior, 3px interior, scaled), doors
as 90° arc symbols, windows as double-stroke segments, room labels with sqft
subscript. CAD-grade aesthetic. Drag walls to move (solver re-runs), click a
room for an inspector panel, pinch/scroll zoom, middle-drag pan, floating
toolbar (select, wall, door, window, room, dimension, hatch, text).

### 1.3 Live code validation
Run IRC checks in a Web Worker, surface violations as yellow badges:
egress windows (IRC R310, ≥5.7 sqft net clear, sill ≤44"), hallway width
≥36", door clear width ≥32", stair geometry (riser 4"–7¾", tread ≥10",
headroom ≥6'-8"), bedroom min 70 sqft and 7' min dimension, ceiling height
≥7'-0" habitable / 6'-8" bath, smoke/CO detector coverage.

### 1.4 Persist the plan
Save `PlanGraph` to localStorage (debounced 300ms); hydrate on mount. Persist
to Cloudflare KV when signed in: `plans/{userId}/{projectId}`.

## Section 2 — Real 3D viewport

- `components/Viewport3D.tsx`: React Three Fiber + drei, ACES filmic tone
  mapping. Extrude walls, slab, roof per type, CSG openings via
  `three-bvh-csg`. PBR materials. HDRI environment lighting. SunCalc-driven
  sun with a time-of-day slider, soft shadows. Orbit/walk/preset cameras.
- Real-time material editor: click a surface → inspector, 30 PBR presets per
  surface type from `assets/materials.json`.
- Photoreal renders: instant AO preview then a `three-gpu-pathtracer` pass to
  4K; save PNG to localStorage + R2.
- Outdoor context: OSM buildings + streets, USGS 3DEP terrain, the home sited
  on the actual parcel with actual setbacks.

## Section 3 — Sheet set / blueprint export

- `lib/sheets/engine.ts`: ANSI + ARCH sheet sizes, editable title block,
  viewport objects (source view + scale + crop), annotations.
- Auto sheet-set generation (A-000 … A-501) rendered via `@react-pdf/renderer`
  to a multi-page PDF, AIA line weights, 24"×36".
- DWG export via `dxf-writer` (R12 ASCII, AIA layers). IFC4 via a hand-rolled
  STEP-21 writer (`lib/io/ifc4.ts`). GLTF/GLB via `three-stdlib` GLTFExporter.

## Section 4 — Client portal that closes deposits

- Route `/p/{projectSlug}/{shareToken}` (no auth). Branded top bar, hero
  render, tabs (Plans / Renders / Spec / Documents), sticky "Approve & pay
  deposit" footer.
- Stripe Connect Standard: client → Stripe → builder direct, Atelier takes a
  0.5% application fee. `/api/stripe-webhook` marks the project `funded`.
- Live multiplayer review via Yjs + `y-webrtc`; Twilio Video call option.
- Point-pinned comment threads as Yjs `Y.Array` entries.

## Section 5 — Performance, accessibility, SEO

- Lighthouse ≥95 every page/audit. Code-split each studio. LCP <1.5s on 4G,
  FID <50ms, CLS <0.05.
- WCAG 2.2 AA: full keyboard nav, copper `:focus-visible` rings, aria-labels,
  7:1 body contrast, reduced-motion respected, screen-reader pass.
- Per-route metadata, `/sitemap.xml` with deep showcase URLs, 10 SEO landing
  pages (one per style, ~800 words each), per-project OpenGraph images.
- i18n-ready: strings via `next-intl`, dimensions stored in mm, currency via
  `Intl.NumberFormat`.

## Section 6 — User-ability moves

Command palette (`Cmd+K`, `cmdk`), undo/redo everywhere (Yjs `Y.UndoManager`),
autosave indicator, onboarding tour, empty states with personality, meaningful
toasts (`sonner`), hover previews, smart copy/paste, live measurement overlay,
daylight slider, live cost-estimate ticker, AI revision chat with structured
tool-use.

## Section 7 — Moat amplification

- `/partner/dashboard`: stamp-partner portal — queue, review, sign, payout
  (80% architect / 20% Atelier).
- `/match` + `/gc-network`: builder-match flow, 1% referral on signed
  contracts.
- `/gallery`: public design gallery of approved-and-paid projects, opt-in.

## Section 8 — Hardening

- Error boundaries around every studio → Sentry → graceful recovery card.
- Anthropic API resilience: exponential-backoff retry on 5xx, honor
  `retry-after` on 429, on-device fallback with a non-alarming notice.
  **(Shipped in v1.1 PR #4 — see `app/api/design/route.ts`.)**
- Rate limiting on `/api/save-brief`, `/api/stamp-apply`, `/api/match`.
  Stripe webhook signature verification.
- Vitest for the kernel (≥80% on `lib/kernel/`), Playwright critical-path,
  Chromatic visual regression.

## Section 9 — Launch sequence

Tag `v2.0.0`, deploy to production, smoke-test the full flow on a real
Indiana parcel, record a 90-second Loom, post to X / LinkedIn / IndieHackers /
ProductHunt, DM influential accounts, send the cold-email batch.

## How to work

Branch per section, one conventional commit per logical change, open PRs as
you go, run `npm run build` / `lint` / typecheck after every section, write a
short `docs/v2-{section}.md` per finished section.
