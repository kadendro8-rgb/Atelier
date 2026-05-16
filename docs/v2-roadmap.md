# Atelier v2.0 — Roadmap & scaffold status

Full spec: [`docs/v2-spec.md`](./v2-spec.md).

This document tracks the v2.0 build. The repository currently contains a
**scaffold** of all nine sections — directory structure, real type
definitions, and honest `// TODO(v2-section-N)` stubs. Nothing in Sections 1–7
is implemented yet; the stubs compile and the existing v1.1 site is untouched.

> DECISION: the spec calls for one `docs/v2-{section}.md` per *finished*
> section. Since no section is finished, status is consolidated here instead.
> DECISION: the spec calls for a branch per section. Per this repo's standing
> branch policy all work lands on `claude/build-atelier-marketing-site-bWmpJ`.

## Status

| Section | Area | Status | Scaffolded surfaces |
|---|---|---|---|
| 1 | Floor-plan engine | §1.1–§1.3 done | `generatePlan` solver, `validatePlan` IRC engine, `PlanCanvas` SVG renderer, wired into the builder; §1.4 KV persistence + drag-edit pending |
| 2 | 3D viewport | Core done + wired | R3F viewport + `buildScene` massing, live in the floor-plan step; CSG/HDRI/pathtracer pending |
| 3 | Sheet set / export | Core done | `generateSheetSet` + real DWG + minimal IFC4; PDF render + GLTF pending |
| 4 | Client portal | Core done | branded portal page + deposit UI; real Stripe Connect + multiplayer pending |
| 5 | Perf / a11y / SEO | §5.3 SEO done | sitemap, robots, 10 showcase landing pages; perf/a11y pending |
| 6 | User-ability moves | Core done | `cmdk` command palette + `sonner` toasts; undo/tour/cost-ticker pending |
| 7 | Moat amplification | Done | partner dashboard, match, GC network, gallery — all real pages |
| 8 | Hardening | Core done | `StudioErrorBoundary` wraps the builder; 35 Vitest kernel tests; §8.2 API resilience shipped earlier |
| 9 | Launch sequence | Not started | — |

## What "scaffolded" means here

- Types are real and complete — `lib/kernel/types.ts` is usable today.
- Functions and components are typed stubs: correct signatures, a
  `// TODO(v2-section-N)` marker, and either a trivial placeholder return or a
  `not implemented` throw. They are wired into nothing and break nothing.
- New routes render a `SectionPlaceholder` card so they are viewable without
  pretending to be finished.

## Next step per section

Each section is a separate, substantial workstream. Point a dedicated agent
or contributor at `docs/v2-spec.md` for the section it owns, starting with
**Section 1** since every other section depends on a real `PlanGraph`.
