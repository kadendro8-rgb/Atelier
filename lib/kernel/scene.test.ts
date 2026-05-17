import { describe, expect, it } from "vitest";
import { generatePlan } from "./plan";
import { buildScene, type MeshData } from "./scene";
import type { ParsedBrief, PlanGraph, RoofType } from "./types";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

function sampleBrief(roof: RoofType = "gable"): ParsedBrief {
  return {
    totalSqft: 1800,
    stories: 1,
    rooms: [
      { use: "great-room", count: 1, minSqft: 300, maxSqft: 420 },
      { use: "kitchen", count: 1, minSqft: 180, maxSqft: 260 },
      { use: "primary-suite", count: 1, minSqft: 240, maxSqft: 320 },
      { use: "bedroom", count: 2, minSqft: 120, maxSqft: 180 },
      { use: "bathroom", count: 2, minSqft: 60, maxSqft: 100 },
    ],
    adjacencies: [],
    roof,
    lotOrientation: "S",
  };
}

/** A graph with bounds but no walls — exercises the fallback footprint path. */
function wallessGraph(roof: RoofType = "flat"): PlanGraph {
  return {
    schemaVersion: 1,
    seed: 1,
    level: "Main level",
    bounds: { width: 12000, height: 9000 },
    rooms: [],
    walls: [],
    openings: [],
    roof,
  };
}

/** Every index must address a vertex that exists in the positions buffer. */
function indicesAreInBounds(mesh: MeshData): boolean {
  const vertexCount = mesh.positions.length / 3;
  return mesh.indices.every((i) => Number.isInteger(i) && i >= 0 && i < vertexCount);
}

/* -------------------------------------------------------------------------- */
/* Structural validity                                                        */
/* -------------------------------------------------------------------------- */

describe("buildScene — structural validity", () => {
  const scene = buildScene(generatePlan(sampleBrief(), 42));

  it("carries the source graph through unchanged", () => {
    const graph = generatePlan(sampleBrief(), 42);
    expect(buildScene(graph).graph).toBe(graph);
  });

  it("reports a meshCount equal to the mesh array length", () => {
    expect(scene.meshCount).toBe(scene.meshes.length);
  });

  it("emits a floor, walls and roof mesh for a full graph", () => {
    const ids = scene.meshes.map((m) => m.id);
    expect(ids).toContain("floor");
    expect(ids).toContain("walls");
    expect(ids).toContain("roof");
    expect(scene.meshCount).toBe(3);
  });

  it("tags each mesh with a valid PBR material", () => {
    const byId: Record<string, MeshData["material"]> = {
      floor: "floor",
      walls: "wall",
      roof: "roof",
    };
    for (const mesh of scene.meshes) {
      expect(mesh.material).toBe(byId[mesh.id]);
    }
  });

  it("keeps every positions buffer a flat triple of finite numbers", () => {
    for (const mesh of scene.meshes) {
      expect(mesh.positions.length % 3).toBe(0);
      expect(mesh.positions.every(Number.isFinite)).toBe(true);
    }
  });

  it("keeps every triangle index inside its positions buffer", () => {
    for (const mesh of scene.meshes) {
      expect(mesh.indices.length % 3).toBe(0);
      expect(indicesAreInBounds(mesh)).toBe(true);
    }
  });

  it("reports positive, finite footprint extents", () => {
    expect(scene.size.width).toBeGreaterThan(0);
    expect(scene.size.depth).toBeGreaterThan(0);
    expect(scene.size.height).toBeGreaterThan(0);
    expect(Number.isFinite(scene.size.width)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Determinism                                                                */
/* -------------------------------------------------------------------------- */

describe("buildScene — determinism", () => {
  it("produces byte-identical geometry for the same graph", () => {
    const graph = generatePlan(sampleBrief(), 7);
    expect(JSON.stringify(buildScene(graph).meshes)).toEqual(
      JSON.stringify(buildScene(graph).meshes),
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Roof massing                                                               */
/* -------------------------------------------------------------------------- */

describe("buildScene — roof massing", () => {
  it("keeps a flat roof at wall height (no rise)", () => {
    const scene = buildScene(generatePlan(sampleBrief("flat"), 1));
    // WALL_HEIGHT_M (2.7) + 0 rise.
    expect(scene.size.height).toBeCloseTo(2.7, 5);
  });

  it("adds a 2 m ridge rise for pitched roofs", () => {
    for (const roof of ["gable", "hip", "shed"] as RoofType[]) {
      const scene = buildScene(generatePlan(sampleBrief(roof), 1));
      // WALL_HEIGHT_M (2.7) + ROOF_RISE_M (2.0).
      expect(scene.size.height).toBeCloseTo(4.7, 5);
    }
  });

  it("emits a roof mesh with geometry for every roof archetype", () => {
    for (const roof of ["flat", "gable", "hip", "shed"] as RoofType[]) {
      const scene = buildScene(generatePlan(sampleBrief(roof), 1));
      const roofMesh = scene.meshes.find((m) => m.id === "roof");
      expect(roofMesh).toBeDefined();
      expect(roofMesh!.indices.length).toBeGreaterThan(0);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Walless fallback                                                           */
/* -------------------------------------------------------------------------- */

describe("buildScene — walless graph", () => {
  const scene = buildScene(wallessGraph());

  it("omits the walls mesh when the graph has no walls", () => {
    expect(scene.meshes.some((m) => m.id === "walls")).toBe(false);
  });

  it("still lays a floor slab over the fallback footprint", () => {
    const floor = scene.meshes.find((m) => m.id === "floor");
    expect(floor).toBeDefined();
    expect(floor!.indices.length).toBeGreaterThan(0);
  });

  it("derives footprint extents from the graph bounds (mm → m)", () => {
    // bounds 12000 × 9000 mm → 12 × 9 m.
    expect(scene.size.width).toBeCloseTo(12, 5);
    expect(scene.size.depth).toBeCloseTo(9, 5);
  });
});
