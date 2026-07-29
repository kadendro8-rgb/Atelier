# 00 — Spec Audit

**Status:** Written before any application code (per operating order).
**Date:** 2026-07-29

## 0. Finding #1 — PRODUCT_SPEC.md was never provided

The kickoff instructions ("CLAUDE.md") say the repository should contain `PRODUCT_SPEC.md` as the
source of truth for product intent. **It does not exist in this repository**, and no PassportIQ /
Financial Passport content exists anywhere in the repo or its git history (the repo contains an
unrelated project, Atelier, which is left untouched — PassportIQ lives entirely under
`/passportiq`).

This audit therefore covers two things:
1. The kickoff brief itself (which summarizes the spec's key sections), audited as if it were the spec.
2. An explicit register of **every spec-dependent detail that had to be assumed**, so the founder
   can correct them cheaply. These are marked `ASSUMED (spec missing)` throughout the docs.

**Founder action:** commit the real `PRODUCT_SPEC.md` to `/passportiq/PRODUCT_SPEC.md`. The largest
assumption is the Jordan Carter demo dataset (spec §16) — the seed data shipped in Milestone 1 is a
plausible placeholder, clearly labeled, and trivially replaceable in `prisma/seed.ts`.

### Spec-dependent details that were assumed

| Spec ref | What was assumed | Where |
|---|---|---|
| §16 Jordan Carter | Full demo dataset (accounts, assets, liabilities, income, entity) invented as a plausible placeholder | `prisma/seed.ts` |
| §5 aesthetic | Exact hex values for "dark charcoal, off-white, stone, muted green, restrained gold" | `src/app/globals.css` tokens |
| §12 schema | Column-level details beyond the table names listed in the kickoff brief | `prisma/schema.prisma`, `docs/03-DATA-MODEL.md` |
| §8 security | The full list of spec security items; deferred list reconstructed from typical scope | `docs/04-SECURITY-MODEL.md` |
| §15 Phase 1 | Only the quoted outcome sentence is known; milestone 2–3 proposals derived from it | `docs/08-MILESTONES.md` |
| Accredited-investor thresholds | Not implemented in M1 (deferred to M3); rule constants left to M3 with attorney review flagged | `docs/06-CALC-ENGINE.md` |

## 1. Contradictions (within the available brief)

1. **"Privacy-first financial identity platform" vs. a shareable-report stub in Milestone 3.**
   Sharing surfaces are where privacy claims die. Resolution: M3's "shareable read-only report" is a
   *stub* (tokenized read-only page, no third-party identity, revocable), and no privacy *guarantees*
   are stated anywhere until a real security review happens.
2. **"Eligibility platform" vs. "no user is ever marked verified from self-entered data."**
   Both are honored by strictly separating *readiness estimation* (M3, self-reported, always labeled
   estimated) from *verification* (deferred, requires licensed third parties). The word "verified"
   never appears on any M1–M3 surface except as an explicitly absent status.
3. **"Institutional, dense-but-clear" UI vs. solo-founder budget.** Density done badly is worse than
   simplicity. Resolution: ~8 components built well (per the brief's own instruction), density added
   only where data exists to justify it.
4. **Credential cryptography/QR named in module layout (`credentials`) but deferred.** The module
   directory exists as a boundary with an honest "deferred" README-level note; no stub crypto.

## 2. Unsafe assumptions found (and the posture that neutralizes them)

- **Self-reported ≠ verified.** Every value in the system carries a `verificationStatus` whose only
  M1 values are `USER_REPORTED` and `ESTIMATED`. `VERIFIED` exists in the enum so the data model
  doesn't change later, but nothing in M1 code can set it. A test asserts the seed contains no
  `VERIFIED` rows.
- **Mocked aggregation must not look real.** `MockAggregationProvider` is named MOCK in code, and
  every surface fed by it renders a visible "DEMO DATA / MOCK" badge. There is no "Connect your
  bank" button in M1 at all — a mocked connect flow would itself be a fake integration.
- **"Eligibility" language can constitute investment advice or a compliance claim.** M1 renders the
  Eligibility nav item as a "Coming in Milestone 3" state and nothing else. M3 wording must be
  "estimated readiness, not a determination" — flagged for attorney review before M3 ships.
- **Net-worth figures can imply accuracy they don't have.** Every calculated stat carries source,
  verification badge, rule version, and last-updated timestamp — enforced by the calc-engine return
  shape, not by UI discipline.

## 3. Excessive MVP scope — deferred with justification

Everything below is named in the brief's module list or typical for this product class, and is
**out** of Milestones 1–3:

| Item | Why deferred |
|---|---|
| Identity verification (KYC) | Requires licensed vendor + compliance posture; nothing in M1–3 needs a verified identity |
| Third-party verifier workflow | Depends on verification existing at all |
| Credential cryptography / QR verifiable credentials | Cryptographic credentials over unverified data are theater |
| Opportunities marketplace | Two-sided marketplace ≠ solo-founder MVP; likely broker-dealer questions |
| Institutional portal | No institutions until there are users |
| Payments/billing | Nothing to charge for yet |
| Real account aggregation (Plaid-class) | Cost + security surface; the `ProviderAdapter` interface is shaped for it so swap-in is cheap |
| Document upload + field extraction | M1 stubs object storage on local disk; extraction returns hand-seeded values only in M2+, labeled MOCK |
| MFA / passkeys | Deferred, stated in `04-SECURITY-MODEL.md`; auth interface leaves room |
| Households with multiple live members | Schema supports it; UI is single-owner until M3+ |
| Scenario/hypothetical modeling | Design constraint honored now (actuals never mingle); feature much later |
| Mobile apps, exports, integrations API | Web only |

## 4. Missing architecture decisions (DECIDED-BY-DEFAULT)

Each is a default the founder can override; none should silently persist.

1. **Repo placement** — PassportIQ lives in `/passportiq` inside this repo, self-contained, because
   the target repo was not empty. DECIDED-BY-DEFAULT. (Extracting to its own repo later is a
   directory move.)
2. **Auth session mechanism** — opaque random token, SHA-256 hash stored in Postgres `sessions`
   table, httpOnly secure cookie; no JWTs. DECIDED-BY-DEFAULT.
3. **Password hashing** — bcrypt (`bcryptjs`, cost 12). The brief allows argon2/bcrypt; bcryptjs has
   no native-build fragility for a solo founder. DECIDED-BY-DEFAULT.
4. **Money representation** — Prisma `Decimal(18,2)` in Postgres, `decimal.js` in the calc layer,
   strings across the wire. Never `number`. DECIDED-BY-DEFAULT (brief mandates decimal-safe).
5. **Multi-tenancy scope unit** — the `household` is the tenancy boundary; every domain row hangs
   off a household. DECIDED-BY-DEFAULT.
6. **Ownership model** — `asset_ownership` join rows carry `ownerType` (USER | ENTITY) +
   percentage; personal net worth counts a user's direct share plus their share *through* entities,
   with a double-counting guard. DECIDED-BY-DEFAULT.
7. **Rule versioning** — `rule_versions` table + hardcoded current constants in the calc module;
   every calc result records the rule version string. DECIDED-BY-DEFAULT.
8. **ID strategy** — cuid via Prisma. DECIDED-BY-DEFAULT.
9. **Timestamps** — all UTC, `timestamptz`. DECIDED-BY-DEFAULT.
10. **Deployment target** — none in M1; local dev only. Anything else is premature.

## 5. Regulatory risk register (top 10, ranked)

Not legal advice; every item below needs an attorney before the related surface ships.

| # | Risk | Why it applies | MVP posture that avoids triggering it | Needs before shipping |
|---|---|---|---|---|
| 1 | **Investment-adviser characterization (SEC/state)** | "Eligibility" and readiness outputs can look like personalized investment advice | M1–M3 output is factual arithmetic on user-entered data, labeled estimates; no recommendations, no opportunities | Securities attorney review of all eligibility wording |
| 2 | **Accredited-investor verification under Reg D 506(c)** | Only specific third parties can provide reasonable-steps verification | Platform states *readiness*, never *verification*; verification is a named deferral requiring a licensed partner | Licensed verifier partnership + attorney |
| 3 | **State money/financial-data licensing (varies)** | Aggregating and displaying financial data can trip state regimes | No real aggregation in M1–3 (mock only); no money movement ever in scope | 50-state survey or vendor reliance before real aggregation |
| 4 | **GLBA / FCRA adjacency** | Assembling financial dossiers shared with third parties can look like consumer reporting | No third-party sharing in M1–2; M3 share stub is user-initiated, revocable, and displays only the user's own data to whom they choose | Attorney review of M3 sharing before launch |
| 5 | **Privacy statutes (CCPA/CPRA, state clones, GDPR if EU users)** | Sensitive financial PII | US-only posture, no marketing claims of compliance, data deletion path designed in schema (cascade rules), privacy policy required before any real user | Privacy counsel + policy before public signup |
| 6 | **Data-breach liability** | Storing net worth + account data is a target | M1 stores no real credentials for external institutions (no aggregation), documented honest security posture, field-level encryption plan | Security review before real users |
| 7 | **UDAP / FTC deceptive-practices** | Overstating verification, security, or compliance is the classic trap | Hard rule enforced: no compliance/certification claims anywhere; mocks visibly labeled | Marketing copy review |
| 8 | **KYC/AML obligations** | Only if the platform touches money or opens accounts — it doesn't | Keep it that way through M3 | Attorney the moment payments or accounts appear |
| 9 | **Broker-dealer characterization** | Marketplace connecting investors to opportunities can require registration | Marketplace is a named deferral; no issuer relationships | Securities attorney before any marketplace work |
| 10 | **Electronic-records / e-sign expectations for shared reports** | Third parties relying on shared reports may assume evidentiary quality | Share stub is watermarked "self-reported, unverified" | Attorney review of report wording |

## 6. What this audit changes about the build

- The word "verified" is unrepresentable as a state M1 code can produce.
- Eligibility, Credentials, Documents, Entities render as honest milestone placeholders.
- The seed script and every mocked provider carry MOCK/DEMO labels into the UI.
- All eligibility threshold constants are deferred to M3 *with attorney review flagged in the doc*.
