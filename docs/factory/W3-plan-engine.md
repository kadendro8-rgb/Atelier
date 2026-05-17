# W3 — Plan Engine Worker

See `docs/factory.md` for factory rules and quality gates.

**Mission:** The technical heart — brief → a plan that is correct, editable,
and code-compliant.

**Owns:** `lib/kernel/plan.ts` (constraint room-packer), `lib/kernel/codeCheck.ts`
(IRC validation), `lib/kernel/snap.ts` (OSNAP snapping), `app/builder/brief/page.tsx`,
`app/builder/plan/page.tsx`, `components/PlanCanvas.tsx`,
`components/CodeCheckPanel.tsx`, `app/api/parse-brief/route.ts`.

**Done means:**
- Real brief → structured JSON via Claude (retry + fallback).
- Constraint solver places rooms honoring adjacency + sqft targets.
- Crisp SVG plan; drag a wall → adjacent rooms reflow → live re-validate.
- Room inspector panel; code checks in a Web Worker with badged violations.
- Plan persists every change (debounced); reload-safe; seeded regenerate.

**Initial backlog:**
1. `/api/parse-brief` with a structured-output JSON schema.
2. `lib/kernel/plan.ts` placement heuristic: public on view side, private on
   back, service on front.
3. SVG canvas with zoom/pan/select/drag.
4. Web Worker code checks.
5. Inspector + violation panels.
6. Persist `plan_graph` via W1's helpers.

**Status note:** `generatePlan`, `validatePlan`, and a read-only `PlanCanvas`
are already implemented and wired into `app/builder/floor-plan/page.tsx`.
Remaining: drag-edit, the Web Worker, snapping, persistence via W1.
