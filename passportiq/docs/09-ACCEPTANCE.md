# 09 — Milestone 1 Acceptance Checklist

Run everything from `/passportiq`.

## Verification commands

```bash
docker compose up -d db          # Postgres 16 on :5432 (or point DATABASE_URL elsewhere)
cp .env.example .env             # fill in values (all documented)
npm install
npm run db:migrate               # prisma migrate dev
npm run db:seed                  # Jordan Carter demo household (placeholder data — spec §16 missing)
npm run verify                   # typecheck + lint + vitest
npm run dev                      # http://localhost:3000 — log in as the seeded user
npm run test:e2e                 # Playwright smoke (needs dev server or webServer config)
```

## Checklist

### Foundation
- [ ] TypeScript strict; `npm run typecheck` clean
- [ ] `npm run lint` clean; Prettier config present
- [ ] `.env.example` documents every variable
- [ ] README run instructions work from clean clone
- [ ] Docker Compose brings up Postgres

### Data & audit
- [ ] Prisma migrations apply cleanly to empty DB
- [ ] All M1 tables from `03-DATA-MODEL.md` exist
- [ ] Append-only tables have no update/delete code paths
- [ ] Typed audit writer used by every mutating action
- [ ] Seed runs idempotently; contains **zero** `VERIFIED` statuses (asserted by test)

### Auth
- [ ] Signup/login/logout/revocation through `AuthProvider` interface only
- [ ] Passwords bcrypt-hashed; session tokens stored only as SHA-256
- [ ] Session cookie httpOnly + sameSite; expiry enforced server-side
- [ ] Auth mutations write audit events

### Calc engine
- [ ] All six formulas return the full `CalcResult` contract
- [ ] Unit tests: each formula, primary-residence adjustment (incl. clamp), double-counting guard,
      zero-division ratio, confidence degradation, decimal exactness (string equality)
- [ ] No `number` used for money anywhere in calc/ledger paths

### Dashboard
- [ ] All 11 nav items render; unbuilt sections state "Coming in Milestone N"; zero dead controls
- [ ] Overview stats computed via calc module (not hardcoded) — verified by test seam + code review
- [ ] Every stat shows source, verification badge (user-reported/estimated), rule version, last-updated
- [ ] Demo data visibly labeled as demo
- [ ] No "verified", no compliance claims anywhere in UI copy

### Tests
- [ ] `npm run verify` green (report actual output in `10-MILESTONE-1-REPORT.md`)
- [ ] Integration test: login + Overview data assembly against seeded DB
- [ ] Playwright smoke: login → Overview renders stats

Anything unmet gets listed honestly in `docs/10-MILESTONE-1-REPORT.md` — a true "80%" beats a
false "complete".
