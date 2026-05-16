import type { PlanGraph } from "@/lib/kernel/types";

/**
 * Export a plan graph as an IFC4 STEP-21 file (ISO 16739-1).
 *
 * TODO(v2-section-3): hand-roll a minimal STEP-21 writer for IfcWall,
 * IfcSlab, IfcDoor, IfcWindow, IfcSpace, IfcBuildingStorey, IfcBuilding,
 * IfcSite. Validate against the buildingSMART validator. See
 * docs/v2-spec.md §3.3.
 */
export function exportIFC4(graph: PlanGraph): string {
  void graph;
  throw new Error("exportIFC4 not implemented (v2 Section 3)");
}
