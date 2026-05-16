import { describe, expect, it } from "vitest";
import { generatePlan } from "./plan";
import type { ParsedBrief, PlanGraph, Vec2 } from "./types";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

/** A realistic single-story brief exercising all three interior bands. */
function sampleBrief(): ParsedBrief {
  return {
    totalSqft: 2100,
    stories: 1,
    rooms: [
      { use: "great-room", count: 1, minSqft: 300, maxSqft: 420 },
      { use: "kitchen", count: 1, minSqft: 180, maxSqft: 260 },
      { use: "dining", count: 1, minSqft: 140, maxSqft: 200 },
      { use: "primary-suite", count: 1, minSqft: 240, maxSqft: 320 },
      { use: "bedroom", count: 2, minSqft: 120, maxSqft: 180 },
      { use: "bathroom", count: 2, minSqft: 60, maxSqft: 100 },
      { use: "laundry", count: 1, minSqft: 50, maxSqft: 80 },
      { use: "garage", count: 1, minSqft: 400, maxSqft: 520 },
      { use: "porch", count: 1, minSqft: 80, maxSqft: 140 },
    ],
    adjacencies: [
      { a: "kitchen", b: "dining", relation: "adjacent" },
      { a: "primary-suite", b: "bedroom", relation: "separated" },
    ],
    roof: "gable",
    lotOrientation: "S",
  };
}

/** Deep structural equality via JSON — the graph is plain data. */
const snapshot = (g: PlanGraph) => JSON.stringify(g);

/* -------------------------------------------------------------------------- */
/* Determinism                                                                */
/* -------------------------------------------------------------------------- */

describe("generatePlan — determinism", () => {
  it("produces byte-identical output for the same brief and seed", () => {
    const brief = sampleBrief();
    expect(snapshot(generatePlan(brief, 42))).toEqual(
      snapshot(generatePlan(brief, 42)),
    );
  });

  it("produces different output for different seeds", () => {
    const brief = sampleBrief();
    expect(snapshot(generatePlan(brief, 1))).not.toEqual(
      snapshot(generatePlan(brief, 2)),
    );
  });

  it("records the seed it was generated with on the graph", () => {
    expect(generatePlan(sampleBrief(), 7).seed).toBe(7);
    expect(generatePlan(sampleBrief(), 999).seed).toBe(999);
  });

  it("defaults to seed 1 when none is supplied", () => {
    expect(snapshot(generatePlan(sampleBrief()))).toEqual(
      snapshot(generatePlan(sampleBrief(), 1)),
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Structural validity                                                        */
/* -------------------------------------------------------------------------- */

describe("generatePlan — structural validity", () => {
  const graph = generatePlan(sampleBrief(), 42);

  it("emits a versioned graph with a roof carried from the brief", () => {
    expect(graph.schemaVersion).toBe(1);
    expect(graph.roof).toBe("gable");
    expect(graph.level).toBe("Main level");
  });

  it("creates one room per requirement count", () => {
    // 1+1+1+1+2+2+1+1+1 = 11 room slots.
    expect(graph.rooms).toHaveLength(11);
    const bedrooms = graph.rooms.filter((r) => r.use === "bedroom");
    expect(bedrooms).toHaveLength(2);
  });

  it("gives every room a closed quad polygon and positive area", () => {
    for (const room of graph.rooms) {
      expect(room.polygon).toHaveLength(4);
      expect(room.areaSqft).toBeGreaterThan(0);
      expect(Number.isFinite(room.areaSqft)).toBe(true);
      expect(room.ceilingMm).toBeGreaterThan(0);
      expect(room.id).toMatch(/^room-/);
    }
  });

  it("keeps positive, finite footprint bounds", () => {
    expect(graph.bounds.width).toBeGreaterThan(0);
    expect(graph.bounds.height).toBeGreaterThan(0);
    expect(Number.isFinite(graph.bounds.width)).toBe(true);
    expect(Number.isFinite(graph.bounds.height)).toBe(true);
  });

  it("places every room inside the footprint bounds", () => {
    const inBounds = (p: Vec2) =>
      p.x >= -1 &&
      p.y >= -1 &&
      p.x <= graph.bounds.width + 1 &&
      p.y <= graph.bounds.height + 1;
    for (const room of graph.rooms) {
      for (const vertex of room.polygon) {
        expect(inBounds(vertex)).toBe(true);
      }
    }
  });

  it("derives walls with non-zero length and valid kinds", () => {
    expect(graph.walls.length).toBeGreaterThan(0);
    for (const wall of graph.walls) {
      const len = Math.hypot(
        wall.end.x - wall.start.x,
        wall.end.y - wall.start.y,
      );
      expect(len).toBeGreaterThan(0);
      expect(wall.thicknessMm).toBeGreaterThan(0);
      expect(["exterior", "interior", "partition"]).toContain(wall.kind);
    }
  });

  it("references only existing walls from every opening", () => {
    const wallIds = new Set(graph.walls.map((w) => w.id));
    for (const opening of graph.openings) {
      expect(wallIds.has(opening.wallId)).toBe(true);
      expect(opening.widthMm).toBeGreaterThan(0);
      expect(opening.heightMm).toBeGreaterThan(0);
    }
  });

  it("gives every bedroom and the primary suite an egress window", () => {
    const sleeping = graph.rooms.filter(
      (r) => r.use === "bedroom" || r.use === "primary-suite",
    );
    expect(sleeping.length).toBeGreaterThan(0);
    for (const room of sleeping) {
      // Map the room's edges to walls, then look for a window on them.
      const edgeKey = (a: Vec2, b: Vec2) => {
        const k = (v: Vec2) => `${Math.round(v.x)},${Math.round(v.y)}`;
        return [k(a), k(b)].sort().join("~");
      };
      const wallByKey = new Map(
        graph.walls.map((w) => [edgeKey(w.start, w.end), w.id]),
      );
      const roomWallIds = new Set<string>();
      const poly = room.polygon;
      for (let i = 0; i < poly.length; i++) {
        const id = wallByKey.get(edgeKey(poly[i], poly[(i + 1) % poly.length]));
        if (id) roomWallIds.add(id);
      }
      const hasWindow = graph.openings.some(
        (o) => o.kind === "window" && roomWallIds.has(o.wallId),
      );
      expect(hasWindow).toBe(true);
    }
  });

  it("uses a wide garage-door opening for the garage", () => {
    const garage = graph.rooms.find((r) => r.use === "garage");
    expect(garage).toBeDefined();
    const garageDoor = graph.openings.find((o) => o.kind === "garage-door");
    expect(garageDoor).toBeDefined();
  });
});

/* -------------------------------------------------------------------------- */
/* Orientation & multi-story                                                  */
/* -------------------------------------------------------------------------- */

describe("generatePlan — orientation and stories", () => {
  it("transposes the footprint when the lot faces E or W", () => {
    const south = generatePlan({ ...sampleBrief(), lotOrientation: "S" }, 3);
    const east = generatePlan({ ...sampleBrief(), lotOrientation: "E" }, 3);
    // A 90-degree rotation swaps the bounds dimensions.
    expect(east.bounds.width).toBeCloseTo(south.bounds.height, 0);
    expect(east.bounds.height).toBeCloseTo(south.bounds.width, 0);
  });

  it("annotates the level for a multi-story brief", () => {
    const graph = generatePlan({ ...sampleBrief(), stories: 2 }, 1);
    expect(graph.level).toContain("1 of 2");
  });

  it("handles a minimal single-room brief without crashing", () => {
    const graph = generatePlan(
      {
        totalSqft: 200,
        stories: 1,
        rooms: [{ use: "great-room", count: 1, minSqft: 180, maxSqft: 220 }],
        adjacencies: [],
        roof: "shed",
        lotOrientation: "N",
      },
      5,
    );
    expect(graph.rooms).toHaveLength(1);
    expect(graph.bounds.width).toBeGreaterThan(0);
    expect(graph.bounds.height).toBeGreaterThan(0);
  });
});
