import type { PlanGraph } from "./types";

/** Intermediate 3D model derived from a plan graph, consumed by Viewport3D. */
export type SceneModel = {
  graph: PlanGraph;
  /** Mesh count once built; 0 while stubbed. */
  meshCount: number;
};

/**
 * Build the extruded 3D scene from a plan graph.
 *
 * TODO(v2-section-2): extrude walls to height, add slab + roof per
 * `graph.roof`, cut openings via CSG, assign PBR materials. See
 * docs/v2-spec.md §2.
 */
export function buildScene(graph: PlanGraph): SceneModel {
  return { graph, meshCount: 0 };
}
