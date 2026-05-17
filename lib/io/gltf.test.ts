import { describe, expect, it } from "vitest";
import { generatePlan } from "@/lib/kernel/plan";
import { buildScene, type SceneModel } from "@/lib/kernel/scene";
import type { ParsedBrief } from "@/lib/kernel/types";
import { exportGLB } from "./gltf";

/* -------------------------------------------------------------------------- */
/* Fixtures + GLB reader                                                      */
/* -------------------------------------------------------------------------- */

function brief(): ParsedBrief {
  return {
    totalSqft: 1700,
    stories: 1,
    rooms: [
      { use: "great-room", count: 1, minSqft: 280, maxSqft: 400 },
      { use: "kitchen", count: 1, minSqft: 170, maxSqft: 240 },
      { use: "primary-suite", count: 1, minSqft: 220, maxSqft: 300 },
      { use: "bedroom", count: 1, minSqft: 120, maxSqft: 170 },
    ],
    adjacencies: [],
    roof: "gable",
    lotOrientation: "S",
  };
}

const scene = buildScene(generatePlan(brief(), 42));

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

/** Parse a GLB blob into its header fields and decoded JSON chunk. */
async function readGlb(blob: Blob): Promise<{
  magic: number;
  version: number;
  declaredLength: number;
  actualLength: number;
  json: Record<string, unknown>;
  binLength: number;
}> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);

  const magic = view.getUint32(0, true);
  const version = view.getUint32(4, true);
  const declaredLength = view.getUint32(8, true);

  const jsonLength = view.getUint32(12, true);
  const jsonType = view.getUint32(16, true);
  expect(jsonType).toBe(0x4e4f534a); // "JSON"
  const json = JSON.parse(
    new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)),
  );

  let binLength = 0;
  const binHeader = 20 + jsonLength;
  if (binHeader + 8 <= bytes.byteLength) {
    binLength = view.getUint32(binHeader, true);
    expect(view.getUint32(binHeader + 4, true)).toBe(0x004e4942); // "BIN\0"
  }

  return {
    magic,
    version,
    declaredLength,
    actualLength: bytes.byteLength,
    json,
    binLength,
  };
}

/* -------------------------------------------------------------------------- */
/* Container format                                                           */
/* -------------------------------------------------------------------------- */

describe("exportGLB — GLB container", () => {
  it("returns a binary glTF blob", async () => {
    const blob = exportGLB(scene);
    expect(blob.type).toBe("model/gltf-binary");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("writes a valid 12-byte header", async () => {
    const glb = await readGlb(exportGLB(scene));
    expect(glb.magic).toBe(0x46546c67); // "glTF"
    expect(glb.version).toBe(2);
  });

  it("declares a total length that matches the blob", async () => {
    const glb = await readGlb(exportGLB(scene));
    expect(glb.declaredLength).toBe(glb.actualLength);
    expect(glb.actualLength % 4).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */
/* glTF document                                                              */
/* -------------------------------------------------------------------------- */

describe("exportGLB — glTF document", () => {
  it("declares glTF 2.0", async () => {
    const { json } = await readGlb(exportGLB(scene));
    expect((json.asset as { version: string }).version).toBe("2.0");
  });

  it("emits one mesh and node per scene mesh", async () => {
    const { json } = await readGlb(exportGLB(scene));
    expect((json.meshes as unknown[]).length).toBe(scene.meshes.length);
    expect((json.nodes as unknown[]).length).toBe(scene.meshes.length);
  });

  it("emits the wall / floor / roof PBR materials", async () => {
    const { json } = await readGlb(exportGLB(scene));
    const materials = json.materials as { name: string }[];
    expect(materials.map((m) => m.name)).toEqual(["wall", "floor", "roof"]);
  });

  it("gives every POSITION accessor min/max bounds", async () => {
    const { json } = await readGlb(exportGLB(scene));
    const accessors = json.accessors as {
      type: string;
      min?: number[];
      max?: number[];
    }[];
    for (const accessor of accessors.filter((a) => a.type === "VEC3")) {
      expect(accessor.min).toHaveLength(3);
      expect(accessor.max).toHaveLength(3);
      expect(accessor.min!.every(Number.isFinite)).toBe(true);
    }
  });

  it("references a binary buffer sized to the geometry", async () => {
    const { json, binLength } = await readGlb(exportGLB(scene));
    const buffers = json.buffers as { byteLength: number }[];
    expect(buffers).toHaveLength(1);
    // The BIN chunk is padded to 4 bytes, so it is ≥ the declared buffer.
    expect(binLength).toBeGreaterThanOrEqual(buffers[0].byteLength);
  });
});

/* -------------------------------------------------------------------------- */
/* Determinism + edge cases                                                   */
/* -------------------------------------------------------------------------- */

describe("exportGLB — determinism and edge cases", () => {
  it("produces byte-identical output for the same scene", async () => {
    const a = new Uint8Array(await exportGLB(scene).arrayBuffer());
    const b = new Uint8Array(await exportGLB(scene).arrayBuffer());
    expect(a).toEqual(b);
  });

  it("emits a valid, geometry-free GLB for an empty scene", async () => {
    const glb = await readGlb(exportGLB(emptyScene));
    expect(glb.magic).toBe(0x46546c67);
    expect(glb.declaredLength).toBe(glb.actualLength);
    expect((glb.json.meshes as unknown[]).length).toBe(0);
    expect((glb.json.buffers as unknown[]).length).toBe(0);
  });
});
