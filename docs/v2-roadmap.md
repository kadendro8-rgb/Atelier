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
| 1 | Floor-plan engine | Scaffolded | `lib/kernel/types.ts`, `lib/kernel/plan.ts`, `lib/kernel/codeCheck.ts`, `components/builder/PlanCanvas.tsx` |
| 2 | 3D viewport | Scaffolded | `lib/kernel/scene.ts`, `components/builder/Viewport3D.tsx` |
| 3 | Sheet set / export | Scaffolded | `lib/sheets/engine.ts`, `lib/io/dwg.ts`, `lib/io/ifc4.ts`, `lib/io/gltf.ts` |
| 4 | Client portal | Scaffolded | `app/p/[slug]/[token]/page.tsx`, `app/api/stripe-webhook/route.ts` |
| 5 | Perf / a11y / SEO | Scaffolded | `app/showcase/[style]/page.tsx` |
| 6 | User-ability moves | Scaffolded | `components/CommandPalette.tsx` |
| 7 | Moat amplification | Scaffolded | `app/partner/dashboard`, `app/match`, `app/gc-network`, `app/gallery` |
| 8 | Hardening | Partly done | `components/StudioErrorBoundary.tsx`; §8.2 Anthropic resilience **shipped** in v1.1 PR #4 |
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
