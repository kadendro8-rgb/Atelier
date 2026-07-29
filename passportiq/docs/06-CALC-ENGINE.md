# 06 — Calculation Engine

**Module:** `src/modules/calc`. Pure functions, no I/O, deterministic, decimal-safe.

## Money representation

- Postgres: `Decimal(18,2)` via Prisma.
- Code: `decimal.js` `Decimal` end to end in the calc layer.
- Wire/UI: strings, formatted at the edge.
- **Floats are a build failure.** A lint-level review rule plus tests keep `number` out of money
  paths; calc function signatures only accept `Decimal | string`.

## Result contract

Every formula returns:

```ts
interface CalcResult {
  name: string;                 // e.g. "net_worth"
  inputs: Record<string, string>;      // decimal strings, keyed by meaning
  sources: CalcSource[];        // per-input provenance: row ids + verificationStatus + asOf
  exclusions: CalcExclusion[];  // what was deliberately left out and why (e.g. primary residence)
  timestamp: string;            // ISO-8601 UTC, computed-at
  ruleVersion: string;          // e.g. "NW-2026.07"
  result: string;               // decimal string
  confidence: 'user_reported' | 'estimated' | 'mixed';  // derived from worst input status
}
```

`confidence` can never be better than the weakest input; nothing in M1 emits anything implying
"verified".

## Rule versioning

`rule_versions` table seeds the current set; the calc module exports matching constants. Changing a
formula = new rule version row + new constant + updated tests. Snapshots and results always record
which version produced them.

## Milestone 1 formulas (each with unit tests)

| Formula | Rule (M1) | Rule version |
|---|---|---|
| `grossAssets` | Σ current value × owned share (direct + via entities) | `GA-2026.07` |
| `totalLiabilities` | Σ liability balances (household) | `TL-2026.07` |
| `netWorth` | grossAssets − totalLiabilities | `NW-2026.07` |
| `liquidNetWorth` | Σ liquid-asset value × share − totalLiabilities | `LNW-2026.07` |
| `primaryResidenceAdjustedNetWorth` | netWorth − max(0, residenceValue×share − linkedMortgageBalance) — i.e. exclude primary-residence *equity*, in the style of the accredited-investor rule. **Threshold/eligibility semantics deferred to M3 with attorney review; this is arithmetic only.** | `PRNW-2026.07` |
| `debtToAssetRatio` | totalLiabilities ÷ grossAssets (4 dp; null if grossAssets = 0) | `DAR-2026.07` |

### Ownership + double-counting guard

Input shape distinguishes direct ownership (`ownerType: USER`) from entity ownership
(`ownerType: ENTITY` + the user's `entityStakePct`). Effective share =
`ownershipPct × entityStakePct` for entity-held assets. The engine throws
`DoubleCountError` if the same asset id appears as both a direct and entity-held input for the
same computation, and the seed data includes an entity-held asset specifically to exercise this.

### Current value resolution

`asset_valuations` is append-only; current value = row with latest `effectiveAt`. The resolver
lives in `valuation` and hands calc a `{value, asOf, status, valuationId}` — so calc provenance
cites the exact valuation row.

## Required unit tests (M1)

- Each formula: known-input → exact-decimal output (string equality, no float comparison)
- Primary-residence adjustment: with and without linked mortgage; mortgage > value clamps at 0
- Double-counting guard: direct + entity duplicate throws
- Ownership math: fractional percentages keep decimal exactness
- Ratio: zero-asset division returns null result, not Infinity/NaN
- Confidence: mixed statuses degrade to `mixed`; nothing outputs better than its inputs
- Every result carries non-empty `ruleVersion`, `timestamp`, `sources`
