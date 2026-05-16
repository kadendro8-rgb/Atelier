import type { SceneModel } from "@/lib/kernel/scene";

/**
 * Export a built 3D scene as a binary glTF (.glb) with embedded textures.
 *
 * TODO(v2-section-3): run `three-stdlib` GLTFExporter over the scene from
 * `buildScene`. See docs/v2-spec.md §3.3.
 */
export function exportGLB(scene: SceneModel): Blob {
  void scene;
  throw new Error("exportGLB not implemented (v2 Section 3)");
}
