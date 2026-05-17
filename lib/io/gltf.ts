import type { SceneModel } from "@/lib/kernel/scene";

/**
 * Export a built 3D scene as a binary glTF (.glb) with embedded textures.
 *
 * TODO(v2-section-3): run `three-stdlib` GLTFExporter over the scene from
 * `buildScene`. See docs/v2-spec.md §3.3.
 *
 * TODO(v2): blocked on Section 2 — this exporter consumes the Three.js
 * `SceneModel` produced by `buildScene` (the Section 2 3D viewport), which
 * does not yet exist. Implement once Section 2 lands.
 */
export function exportGLB(scene: SceneModel): Blob {
  void scene;
  throw new Error("exportGLB not implemented (v2 Section 3)");
}
