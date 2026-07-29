# 03 — Data Model (Milestone 1 subset of spec §12)

Source of truth: `prisma/schema.prisma`. This doc states intent and invariants.
Spec §12's full column list was not available (see `00-SPEC-AUDIT.md` §0); table set below is the
one mandated by the kickoff brief.

## Conventions

- IDs: cuid strings. Timestamps: `timestamptz` UTC (`createdAt`, `updatedAt`).
- Money: `Decimal(18,2)` in Postgres; `decimal.js` in code; strings over the wire. Never floats.
- Tenancy: every domain row carries `householdId`. All queries are household-scoped.
- Verification: `VerificationStatus` enum = `USER_REPORTED | ESTIMATED | VERIFIED`.
  **No M1 code path can write `VERIFIED`** — the value exists so the schema doesn't churn later.

## Tables (M1)

| Table | Purpose | Notes |
|---|---|---|
| `users` | login identity + profile | no money fields; `isAdmin` for internal role |
| `local_credentials` | password hash for the local AuthProvider | 1:1 user; swap-out point for Clerk/Auth0 |
| `sessions` | server-side sessions | stores SHA-256 of token, expiry, revocation timestamp |
| `households` | tenancy boundary | |
| `household_members` | user↔household + role (`OWNER`, `HOUSEHOLD_MEMBER`) | shape allows ABAC later (see `05-PERMISSIONS.md`) |
| `legal_entities` | LLCs/trusts owned by the household | M1: seeded + listed only |
| `accounts` | financial accounts (checking, brokerage…) | `source` = MANUAL in M1; shaped for aggregation later |
| `assets` | things of value | `category`, `liquidity` (LIQUID/ILLIQUID), `isPrimaryResidence` |
| `asset_valuations` | **append-only** value observations | current value = latest by `effectiveAt`; never UPDATE |
| `asset_ownership` | who owns what share | `ownerType` USER or ENTITY + `ownershipPct`; see invariant below |
| `liabilities` | debts | `linkedAssetId` optional (mortgage → residence) |
| `income_sources` | income streams | needed for M3 income-path readiness |
| `net_worth_snapshots` | **append-only** computed snapshots | stores result + ruleVersion + input digest |
| `audit_events` | **append-only** audit log | writer in `src/modules/audit`; called by every mutating action |
| `rule_versions` | registry of calculation rule versions | seeded with the M1 rule set |

## Invariants

1. **Append-only**: `asset_valuations`, `net_worth_snapshots`, `audit_events` are never updated or
   deleted by application code. Corrections are new rows.
2. **Ownership sums**: total `ownershipPct` per asset ≤ 100. Enforced in `ledger` write path (M2)
   and by seed-time assertion (M1).
3. **No double counting**: an asset owned by an entity contributes to a user's net worth only via
   `userShare × entityShare`; it must never also be counted as a direct personal holding. Guarded
   in `calc` (unit-tested in M1) and at write time (M2).
4. **Hypothetical data never mingles**: no scenario tables exist yet; when they do, they will be
   separate tables, not flags on actual records (design constraint recorded now).

## Deferred tables (named, not built)

`verification_requests`, `verifier_parties`, `credentials` (cryptographic), `documents` +
`document_fields` (M2 metadata only, extraction later), `share_grants` (M3 stub),
`opportunities`, `institutions`, `payments`, `scenarios`.
