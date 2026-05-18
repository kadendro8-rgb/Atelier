# Atelier

A hardscape design generator. Describe a backyard — patios, walkways,
driveways, pool decks, steps — and Atelier produces a scaled site layout, a
2D/3D visualization, and a ballpark installed-cost estimate, live as you edit
the brief.

The whole product is a single page (`app/page.tsx`). It composes a controlled
brief builder with a deterministic design kernel (`lib/hardscape/`): every
brief edit re-derives the plan, so the same brief always lays out the same way.

Next.js 15 · React 19 · TypeScript · Tailwind v4 · three.js.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Vitest — the hardscape kernel test suites |

## Structure

- `app/page.tsx` — the hardscape design generator (the entire product).
- `lib/hardscape/` — the pure, deterministic design kernel: types, brief
  builder, layout generator, 3D scene builder, and cost estimator (with tests).
- `components/builder/` — the brief builder, the 2D layout SVG, and the 3D
  viewport.
