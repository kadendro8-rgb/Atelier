// Atelier — hardscape design kernel: cost estimator.
//
// `estimateCost` turns a `HardscapePlan` into a low/high cost range. The model
// is a per-square-foot range per material multiplied by each element's area,
// aggregated across the plan. Figures are ballpark RSMeans-style installed
// costs and are intentionally rough — see the comment on `COST_PER_SQFT`.

import type { HardscapeMaterial, HardscapePlan } from "./types";

/* -------------------------------------------------------------------------- */
/* Cost model                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Installed cost per square foot, in US cents, per material.
 *
 * DECISION: these are ESTIMATES — ballpark RSMeans-style installed figures for
 * residential exterior flatwork (material + labor), expressed in cents to keep
 * the model integer-only. They are deliberately wide ranges; a real estimator
 * would localize by region, thickness, sub-base and access. Treat as a
 * planning ballpark, not a bid.
 *
 *   broom-finish        $8 – $14 /sqft   — standard broomed concrete slab
 *   stamped-concrete    $12 – $22 /sqft  — patterned / colored stamped slab
 *   exposed-aggregate   $11 – $20 /sqft  — washed aggregate finish
 *   pavers              $15 – $30 /sqft  — interlocking concrete pavers
 *   natural-stone       $25 – $50 /sqft  — flagstone / bluestone, set in mortar
 */
const COST_PER_SQFT: Record<
  HardscapeMaterial,
  { lowCents: number; highCents: number }
> = {
  "broom-finish": { lowCents: 800, highCents: 1400 },
  "stamped-concrete": { lowCents: 1200, highCents: 2200 },
  "exposed-aggregate": { lowCents: 1100, highCents: 2000 },
  pavers: { lowCents: 1500, highCents: 3000 },
  "natural-stone": { lowCents: 2500, highCents: 5000 },
};

/** Low/high cost estimate for a hardscape plan, in whole US cents. */
export type HardscapeCostEstimate = {
  lowCents: number;
  highCents: number;
};

/**
 * Estimate the installed cost of a hardscape plan as a low/high range.
 *
 * Each element's area is multiplied by its material's per-square-foot range;
 * the per-element costs are summed. The result is monotonic in area — adding
 * area can only raise the estimate — and `lowCents <= highCents` always holds
 * because every material's low rate is `<=` its high rate.
 */
export function estimateCost(plan: HardscapePlan): HardscapeCostEstimate {
  let lowCents = 0;
  let highCents = 0;

  for (const element of plan.elements) {
    const rate = COST_PER_SQFT[element.material];
    // Guard against any non-finite / negative area sneaking in.
    const area = Number.isFinite(element.areaSqft)
      ? Math.max(element.areaSqft, 0)
      : 0;
    lowCents += area * rate.lowCents;
    highCents += area * rate.highCents;
  }

  return {
    lowCents: Math.round(lowCents),
    highCents: Math.round(highCents),
  };
}
