import { describe, expect, it } from "vitest";
import type { SceneModel } from "@/lib/kernel/scene";
import { exportGLB } from "./gltf";

/* -------------------------------------------------------------------------- */
/* Stub guard                                                                 */
/* -------------------------------------------------------------------------- */

// `exportGLB` is a declared-but-unimplemented v2 Section 3 export. This test
// pins the stub contract: the day it gains a real implementation this
// assertion fails, prompting a proper GLB test to replace it.
describe("exportGLB — unimplemented stub", () => {
  const emptyScene: SceneModel = {
    graph: {
      schemaVersion: 1,
      seed: 1,
      level: "Main level",
      bounds: { width: 1000, height: 1000 },
      rooms: [],
      walls: [],
      openings: [],
      roof: "flat",
    },
    meshes: [],
    size: { width: 1, depth: 1, height: 2.7 },
    meshCount: 0,
  };

  it("throws a v2-Section-3 not-implemented error", () => {
    expect(() => exportGLB(emptyScene)).toThrowError(/not implemented/i);
  });
});
