# W1 — Foundation Worker

See `docs/factory.md` for factory rules and quality gates.

**Mission:** Every other worker depends on the schema, auth, and persistence
layer. If W1's work is wrong, every downstream station produces broken parts.

**Owns:** `supabase/migrations/`, `lib/db/` (typed Supabase client wrappers),
`lib/auth/` (session + RLS helpers), `lib/env/` (Zod env validation), RLS
policies.

**Done means:**
- Every table has tested RLS policies.
- Every `lib/db/` helper has a TypeScript signature.
- A `seed.sql` populates a realistic test project.
- Migration files are version-controlled and idempotent.

**Initial backlog (in order):**
1. Reconcile `leads` vs `saved_briefs` — keep `leads`, fold the extra columns
   (`source`, `resume_token`) in via `ALTER`, drop `saved_briefs`.
2. Apply the v2 core migration to the Supabase project. **(Foreman task — needs
   dashboard access.)**
3. Typed wrappers: `getProject(id)`, `createProject(data)`, `updateProject`,
   `saveBrief(email, brief)`, `getPlanGraph`, `savePlanGraph`.
4. `lib/auth/getSession()` → `{ user, profile } | null`.
5. `seed.sql` with one realistic test project.
