import type { PlanGraph } from "@/lib/kernel/types";

/**
 * Export a plan graph as AutoCAD R12 ASCII DXF.
 *
 * TODO(v2-section-3): use `dxf-writer` to emit walls, openings, and
 * dimensions on AIA CAD-standard layers (A-WALL, A-WALL-EXT, A-DOOR,
 * A-WIND, A-ANNO-DIMS). See docs/v2-spec.md §3.3.
 */
export function exportDWG(graph: PlanGraph): string {
  void graph;
  throw new Error("exportDWG not implemented (v2 Section 3)");
}
