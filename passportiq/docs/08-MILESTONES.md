# 08 — Milestones & Acceptance Criteria

## Milestone 1 — Foundation + honest dashboard

Scope: see `01-MVP-SCOPE.md`. Acceptance (full checklist in `09-ACCEPTANCE.md`):

- `npm run verify` passes (typecheck + lint + unit/integration tests)
- Playwright smoke: login as seeded user → Overview renders computed stats
- Every calc formula unit-tested, incl. primary-residence adjustment + double-counting guard
- Seed contains zero `VERIFIED` statuses (tested)
- All 11 nav sections render; unbuilt ones state their milestone; no dead controls
- Audit events written for signup/login/logout/revocation and seed mutations
- README run instructions work from a clean clone (Docker Postgres + migrate + seed + dev)

## Milestone 2 — Ledger + net-worth engine (proposed)

Scope: full CRUD for accounts/assets/valuations/liabilities/income; ownership editing with
write-time double-count + >100% guards; append-only snapshots; Net Worth page with history;
`MockAggregationProvider` import labeled MOCK/DEMO throughout; document upload to local-disk store
(metadata only).

Acceptance:
- Every mutation writes an audit event and is covered by an integration test
- Ownership invariants enforced at write time (unit + integration tested)
- Snapshot rows immutable (no update path exists; test asserts)
- Mock-imported records visibly DEMO-badged in every view that shows them
- Verify + smoke still green; new pages have no dead controls

## Milestone 3 — Accredited-readiness (proposed)

Scope: readiness questionnaire (income/net-worth/professional-license paths) with rule-versioned
thresholds; evidence checklist; estimated-readiness result; shareable read-only report stub
(tokenized, revocable, watermarked "self-reported, unverified").

Acceptance:
- Result wording says "estimated readiness"; the words "verified/qualified/approved" absent (tested string-level)
- Thresholds live in `rule_versions` + constants; changing them is a version bump with tests
- Share link: revocation immediate; report displays watermark + generation timestamp; no PII beyond
  what the owner chose to include
- **Gate:** attorney review of questionnaire wording, thresholds, and report language before any
  non-demo user sees M3 surfaces (tracked as a blocking checklist item, not code)

## Explicit non-goals through M3

See `01-MVP-SCOPE.md` named deferrals. **Do not begin Milestone 2 without founder approval**
(operating order, kickoff brief).
