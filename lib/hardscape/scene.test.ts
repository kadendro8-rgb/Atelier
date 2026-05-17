import { describe, expect, it } from "vitest";
import { buildHardscapeScene } from "./scene";
import { generateHardscape } from "./generate";
import type { HardscapeBrief } from "./types";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

/** A realistic brief exercising every element kind and both decor options. */
function sampleBrief(): HardscapeBrief {
  return {
    schemaVersion: 1,
    elements: [
      { kind: "driveway", material: "broom-finish", targetSqft: 640 },
      { kind: "walkway", material: "pavers", targetSqft: 140 },
      { kind: "patio", material: "stamped-concrete", targetSqft: 360 },
      { kind: "pool-deck", material: "exposed-aggregate", targetSqft: 500 },
      { kind: "steps", material: "natural-stone" },
    ],
    decor: {
      bandedBorder: true,
      borderMaterial: "natural-stone",
      medallionInlay: true,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe("buildHardscapeScene", () => {
  it("builds one slab mesh per plan element", () => {
    const plan = generateHardscape(sampleBrief(), 1);
    const model = buildHardscapeScene(plan);
    expect(model.meshCount).toBe(plan.elements.length);
    expect(model.meshes).toHaveLength(plan.elements.length);
  });

  it("carries each element's kind, material and label onto its mesh", () => {
    const plan = generateHardscape(sampleBrief(), 1);
    const model = buildHardscapeScene(plan);
    for (const el of plan.elements) {
      const mesh = model.meshes.find((m) => m.id === el.id);
      expect(mesh).toBeDefined();
      expect(mesh?.kind).toBe(el.kind);
      expect(mesh?.material).toBe(el.material);
      expect(mesh?.label).toBe(el.label);
    }
  });

  it("produces watertight geometry — indices reference valid vertices", () => {
    const plan = generateHardscape(sampleBrief(), 1);
    const model = buildHardscapeScene(plan);
    for (const mesh of model.meshes) {
      expect(mesh.positions.length % 3).toBe(0);
      expect(mesh.indices.length % 3).toBe(0);
      expect(mesh.indices.length).toBeGreaterThan(0);
      const vertexCount = mesh.positions.length / 3;
      for (const idx of mesh.indices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(vertexCount);
      }
    }
  });

  it("extrudes each slab to a positive, kind-appropriate thickness", () => {
    const plan = generateHardscape(sampleBrief(), 1);
    const model = buildHardscapeScene(plan);
    for (const mesh of model.meshes) {
      // Every slab spans a positive Y range (top cap above bottom cap).
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 1; i < mesh.positions.length; i += 3) {
        minY = Math.min(minY, mesh.positions[i]);
        maxY = Math.max(maxY, mesh.positions[i]);
      }
      expect(maxY - minY).toBeGreaterThan(0);
      // Steps are the chunkiest mass; a thin border is the slimmest.
      if (mesh.kind === "steps") {
        expect(maxY - minY).toBeGreaterThan(0.2);
      }
    }
  });

  it("centers the site footprint on the origin, true to mm scale", () => {
    const plan = generateHardscape(sampleBrief(), 1);
    const model = buildHardscapeScene(plan);
    // Site extents convert mm → m one-to-one (no distortion).
    expect(model.size.width).toBeCloseTo(plan.bounds.width * 0.001, 6);
    expect(model.size.depth).toBeCloseTo(plan.bounds.height * 0.001, 6);

    // All geometry sits within the centered half-extents (+ slack for slabs).
    const halfW = model.size.width / 2 + 0.01;
    const halfD = model.size.depth / 2 + 0.01;
    for (const mesh of model.meshes) {
      for (let i = 0; i < mesh.positions.length; i += 3) {
        expect(Math.abs(mesh.positions[i])).toBeLessThanOrEqual(halfW);
        expect(Math.abs(mesh.positions[i + 2])).toBeLessThanOrEqual(halfD);
      }
    }
  });

  it("is deterministic — the same plan yields identical geometry", () => {
    const plan = generateHardscape(sampleBrief(), 1);
    const a = buildHardscapeScene(plan);
    const b = buildHardscapeScene(plan);
    expect(JSON.stringify(a.meshes)).toBe(JSON.stringify(b.meshes));
  });

  it("degrades gracefully on an empty plan", () => {
    const empty = {
      schemaVersion: 1 as const,
      seed: 1,
      elements: [],
      totalAreaSqft: 0,
      bounds: { width: 10_000, height: 10_000 },
    };
    const model = buildHardscapeScene(empty);
    expect(model.meshCount).toBe(0);
    expect(model.size.height).toBeGreaterThan(0);
  });
});
