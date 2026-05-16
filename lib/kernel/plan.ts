import type { ParsedBrief, PlanGraph } from "./types";

/**
 * Generate a deterministic floor-plan graph from a parsed brief.
 *
 * TODO(v2-section-1): replace this stub with the constraint-based
 * room-packing solver described in docs/v2-spec.md §1.1 — place public
 * spaces along the view side, private along the back, service toward the
 * front, then reflect/rotate for lot orientation. Output must stay
 * deterministic for a given `seed`.
 */
export function generatePlan(brief: ParsedBrief, seed = 1): PlanGraph {
  return {
    schemaVersion: 1,
    seed,
    level: "Main level",
    bounds: { width: 0, height: 0 },
    rooms: [],
    walls: [],
    openings: [],
    roof: brief.roof,
  };
}
