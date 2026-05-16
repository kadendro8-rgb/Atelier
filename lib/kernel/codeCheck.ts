import type { PlanGraph } from "./types";

export type CodeViolation = {
  ruleId: string;
  severity: "error" | "warning";
  /** Id of the offending room / wall / opening. */
  objectId: string;
  message: string;
  suggestion: string;
};

/** IRC residential-code thresholds. See docs/v2-spec.md §1.3. */
export const CODE_RULES = {
  egressNetClearSqft: 5.7, // IRC R310
  egressSillMaxIn: 44,
  hallwayMinIn: 36,
  doorClearMinIn: 32,
  stairRiserMinIn: 4,
  stairRiserMaxIn: 7.75,
  stairTreadMinIn: 10,
  stairHeadroomMinIn: 80,
  bedroomMinSqft: 70,
  bedroomMinDimFt: 7,
  ceilingHabitableMinIn: 84,
  ceilingBathMinIn: 80,
} as const;

/**
 * Validate a plan against the IRC rule set.
 *
 * TODO(v2-section-1): implement the rule engine and run it inside a Web
 * Worker so editing stays responsive; surface results in the "Code check"
 * panel with click-to-highlight + suggested fixes.
 */
export function validatePlan(graph: PlanGraph): CodeViolation[] {
  void graph;
  return [];
}
