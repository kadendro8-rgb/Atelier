# 02 — Architecture

**Shape:** modular monolith. One Next.js (App Router) app, one Postgres database, domain logic in
`/src/modules/*`. No microservices, no queues, no caches until a measurement demands one.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Web/app | Next.js App Router + React Server Components | Pages are thin; they call module functions |
| Language | TypeScript `strict` | No `any` in module code |
| Styling | Tailwind v4, tokens in `globals.css` | Design system in `src/components/ui` |
| ORM | Prisma → PostgreSQL | `Decimal(18,2)` for all money columns |
| Money math | `decimal.js` in the calc layer | **Never `number` for money** — see `06-CALC-ENGINE.md` |
| Auth | `AuthProvider` interface, local impl | See `04-SECURITY-MODEL.md` |
| Local dev | Docker Compose (Postgres 16) | `docker compose up -d db` |
| Tests | Vitest (unit/integration) + Playwright (one smoke) | `npm run verify` |

## Module layout

```
src/modules/
  identity/      users, households, membership, RBAC checks, AuthProvider + LocalAuthProvider
  ledger/        accounts, assets, liabilities, income sources, ownership (CRUD + invariants)
  valuation/     asset_valuations (append-only), current-value resolution
  documents/     object-storage abstraction (local-disk stub). M2+: metadata rows
  verification/  verificationStatus vocabulary ONLY in M1 (nothing can set VERIFIED)
  credentials/   DEFERRED — boundary exists, no implementation
  eligibility/   DEFERRED until M3 — boundary exists, no implementation
  audit/         typed audit-event writer (append-only)
  calc/          deterministic calculation engine (pure; no I/O)
```

## Rules of the graph

- **Pages/components → modules → Prisma.** Pages never import Prisma directly.
- **`calc` is pure**: takes typed inputs, returns `CalcResult`; never touches the DB. Callers
  (ledger/pages) assemble inputs. This is what makes every formula unit-testable.
- **`audit` is written to, never read from, by other modules** (reading is an admin surface, later).
- **`identity` is the only module that sees credentials or sessions.**
- Modules may call each other only downward through exported functions: `ledger` → `valuation`,
  anything → `audit`, pages → any module. No circular imports (enforced by review, not tooling, in M1).

## Request flow (Overview page example)

1. Server component checks session via `identity` (cookie → session row).
2. Loads Jordan's ledger rows via `ledger` (household-scoped queries).
3. Feeds typed inputs to `calc` formulas.
4. Renders stat blocks with the full `CalcResult` provenance (source, badge, rule version, timestamp).

## Environment constraint (this build environment)

The remote build environment's network allowlist currently blocks `registry.npmjs.org`, so
dependency installation, migration generation, and test execution are blocked until the founder
adds the registry (and `binaries.prisma.sh` for Prisma engines) to the environment's network
settings. Local development on the founder's machine is unaffected.
