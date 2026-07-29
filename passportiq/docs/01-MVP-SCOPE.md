# 01 — MVP Scope (Milestones 1–3)

**Phase 1 outcome (spec §15):** *"Create a complete personal financial passport and determine
readiness for accredited-investor verification."* Everything not in service of that sentence is a
named deferral (see §3 below and `00-SPEC-AUDIT.md` §3).

## Milestone 1 — Foundation + honest dashboard (this build)

- Next.js (App Router) + TypeScript strict + Tailwind + Prisma + PostgreSQL foundation
- Design tokens + ~8 base components (institutional aesthetic per spec §5)
- `AuthProvider` abstraction with local email+password implementation (sessions, logout, revocation)
- Prisma schema + migrations for the M1 tables; typed audit-event writer on every mutation
- Seeded demo user (Jordan Carter placeholder — spec §16 not available, see `00-SPEC-AUDIT.md` §0)
- Authenticated dashboard shell with full spec §5 nav; unbuilt sections say "Coming in Milestone N"
- Overview page: seeded totals computed through the real calc module, each stat with
  source + verification badge + last-updated
- Unit tests for every calc formula; one auth+dashboard integration test; `npm run verify`

## Milestone 2 — Ledger + net-worth engine (proposed)

- Full CRUD for accounts, assets (with valuations), liabilities, income sources
- Entity ownership editing (`asset_ownership`) with double-counting guard enforced at write time
- Net-worth snapshots: append-only `net_worth_snapshots` written on demand and on material change
- Net Worth page: current figures + snapshot history table (no charts until data warrants)
- `MockAggregationProvider` behind `ProviderAdapter` — imports demo accounts, labeled MOCK end to end
- Document upload to local-disk object-storage stub; metadata rows only (no extraction)

## Milestone 3 — Accredited-readiness (proposed)

- Readiness questionnaire (income / net-worth / license paths), rule-versioned thresholds
  (**attorney review of wording and thresholds required before ship** — flagged, not resolved)
- Evidence checklist derived from answers (what a verifier would ask for)
- Estimated-eligibility result: always "estimated readiness", never a verification
- Shareable read-only report **stub**: tokenized, revocable, watermarked "self-reported, unverified"

## Named deferrals (not M1–M3)

Identity verification (KYC), third-party verifier workflow, credential cryptography/QR,
opportunities marketplace, institutional portal, payments, real aggregation (Plaid-class),
document field extraction beyond hand-seeded values, MFA/passkeys, multi-member household UX,
scenario modeling, exports/API, mobile. Each also appears in `07-INTEGRATIONS.md` or
`00-SPEC-AUDIT.md` §3 with justification.
