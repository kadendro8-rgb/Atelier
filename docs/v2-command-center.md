# Atelier v2.0 — Command Center

The build hub for the v2.0 effort. Work is executed by parallel agents
dispatched from an orchestrating Claude Code session, which reviews, verifies,
and merges every result.

> This is a **maintained status log**, not a live dashboard. The orchestrating
> session runs in an ephemeral cloud container and cannot host a service. The
> two live surfaces are this file (updated on every merge) and **PR #6** on
> GitHub — commits, diffs, and checks.

## Roles

- **Orchestrator** — the main Claude Code session: plans waves, dispatches
  agents, reviews every diff, runs `build` + `lint`, merges to `main`, pushes.
- **Section agents** — one per section, each in an isolated git worktree:
  implement → build → lint → commit to the worktree branch; never push.

## Wave log

| Wave | Section | Scope | Status | Landed |
|---|---|---|---|---|
| 1   | §1 Floor-plan kernel | `generatePlan` solver + `validatePlan` IRC engine | Merged | `51fd5da` |
| 2–3 | §2 3D viewport       | R3F viewport + `buildScene` massing | Merged | `1d61044` |
| 2–3 | §3 Export I/O        | sheet engine + DWG + minimal IFC4 | Merged | `1d61044` |
| 2–3 | §5 SEO               | sitemap, robots, 10 showcase pages | Merged | `1d61044` |
| 2–3 | §7 Moat pages        | partner / match / GC-network / gallery | Merged | `1d61044` |
| 4   | §4 Client portal     | branded portal page + deposit UI | Merged | `218f16e` |
| 4   | §6 UX moves          | command palette + toasts | Merged | `218f16e` |
| 5   | §1.2 + integration  | `PlanCanvas` + plan kernel wired into the builder | Merged | `c5e6021` |
| 5   | §8 Hardening         | error boundary + 35 passing kernel tests | Merged | `c5e6021` |
| —   | §9 Launch            | release sequence (not a code task) | Manual | — |

## Verification gate

A section merges only after the orchestrator runs `npm run build` and
`npm run lint` clean on the integrated result.

**CI note:** the external 4–6 second `build` check on PR #6 fails on every
commit. It is not produced by any workflow file in this repo and is too fast
to evaluate the code — it is broken infrastructure, not a verdict on the
build. The repo's own `ci.yml` runs a real `npm ci` + build.

_Updated by the orchestrator on each merge._
