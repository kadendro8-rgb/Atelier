# Atelier — The Internal Agent Factory

The frame: Atelier isn't selling yet. It's a **factory inside the repo** with
the founder as foreman and Claude/Antigravity agents as specialist workers on
the floor. The product is the output. The factory exists to make the product
excellent. Sales, marketing, legal, partners — none of those workers get hired
until the line is producing perfect units.

When the 12 product quality bars are all green, the factory's external-facing
wing comes online. Until then, every agent works on one thing — the product.

## The factory floor — 6 specialist workers

| Agent | Station | Domain |
|---|---|---|
| **W1 — Foundation** | Schema, persistence, auth, env | The substrate everyone builds on |
| **W2 — Site Intelligence** | Lot picker, parcel, terrain, neighbors | The killer differentiator |
| **W3 — Plan Engine** | Brief → plan, solver, SVG canvas, code validation | The technical core |
| **W4 — Visualization** | 3D viewport, materials, renders, lighting | The "wow" moment |
| **W5 — Output** | Sheet sets, DWG, IFC4, GLB, PDF | Proof it isn't a toy |
| **W6 — Portal** | Client portal, sharing, comments, test-mode payments | Where the value loop closes |

Per-worker job specs live in `docs/factory/W1-foundation.md` … `W6-portal.md`.

## Factory operations

**Shift schedule** — two workers active at a time, always paired so they don't
step on each other's files, always with explicit handoffs.

**Standup** — each morning the foreman asks each active worker: what shipped,
what's shipping today, what's blocked. Logged to `factory/standup-YYYY-MM-DD.md`.

**Handoff contract** — a worker hands off a PR with: working code that passes
the gates, an acceptance test, a handoff doc (`docs/factory/handoff-WN.md`),
and a list of known non-blocking issues.

### Quality gates (every PR must pass)

| Gate | Verify |
|---|---|
| TypeScript compiles | `npm run typecheck` zero errors |
| Lint passes | `npm run lint` zero warnings |
| Build succeeds | `npm run build` clean |
| Tests pass | `npm test` |
| No console errors in prod | smoke test on the Vercel preview |
| Lighthouse ≥ 90 | run on the new pages |
| Mobile works | 375px viewport |
| Reload-safe | state persists across reload |
| Keyboard-navigable | tab through, focus visible |

The foreman signs off by merging in GitHub after eyeballing the preview. If a
gate fails, the PR doesn't merge.

**Final gate (every agent run):** the agent posts a final report including
`git status`, the `npm run typecheck` / `npm run lint` / `npm run build` exit
states, and a one-paragraph summary. No final report = the run is incomplete =
no merge. The foreman runs the protocol in `docs/factory/diagnostic.md` on any
agent run that exits without a final report.

## The transition trigger

The factory stays fully internal until **all 12 product quality bars are green
for two consecutive weeks**:

1. Cold load to interactive ≤ 2s on 4G
2. No console errors in production anywhere in the flow
3. No layout shift during transitions
4. Every error has graceful recovery
5. Save survives reload
6. Plan generation succeeds for 95%+ of briefs without falling back
7. 3D viewport 60fps on M1, 30fps on 5-year Windows
8. Sheet PDF passes the scale-printing test
9. Mobile works at 375px
10. Keyboard navigation works fully
11. Lighthouse ≥ 95 everywhere
12. Sentry quiet across a 50-step smoke test

Only then do the external workers come online — E1 Customer Success,
E2 Marketing, E3 Sales/Outreach, E4 Stamp Network. Not before.

## The factory rules

1. One product, six workers, no exceptions — no marketing/outreach/legal work
   on the floor until the line produces perfect units.
2. Quality gates are not negotiable.
3. Two workers active maximum.
4. Every PR has a Loom or screenshot.
5. Handoffs are documented.
6. The foreman doesn't write code — reviews, merges, sets priorities.
7. Three-legged-stool test on every feature: consumer / maker / company.
8. The factory stays internal until all 12 quality bars are green for two weeks.

## Orchestration note (this repo)

Agents run as isolated git worktrees dispatched by the orchestrating session;
each implements, builds, lints, and commits to its worktree branch. The
orchestrator reviews the diff, runs the gates on the integrated result, and
merges to `main`. Some W-backlog items (applying migrations to the live
Supabase project, dashboard/account configuration) are **foreman tasks** — a
coding agent cannot perform them.
