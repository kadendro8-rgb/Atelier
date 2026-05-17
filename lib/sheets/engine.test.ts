import { describe, expect, it } from "vitest";
import { generatePlan } from "@/lib/kernel/plan";
import type { ParsedBrief, PlanGraph } from "@/lib/kernel/types";
import { generateSheetSet } from "./engine";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

function brief(): ParsedBrief {
  return {
    totalSqft: 2000,
    stories: 1,
    rooms: [
      { use: "great-room", count: 1, minSqft: 300, maxSqft: 420 },
      { use: "kitchen", count: 1, minSqft: 180, maxSqft: 260 },
      { use: "bathroom", count: 2, minSqft: 60, maxSqft: 100 },
      { use: "primary-suite", count: 1, minSqft: 240, maxSqft: 320 },
    ],
    adjacencies: [],
    roof: "gable",
    lotOrientation: "S",
  };
}

/** An empty graph — no footprint, rooms, walls or openings. */
const emptyGraph: PlanGraph = {
  schemaVersion: 1,
  seed: 1,
  level: "Main level",
  bounds: { width: 0, height: 0 },
  rooms: [],
  walls: [],
  openings: [],
  roof: "flat",
};

const numbersOf = (graph: PlanGraph) =>
  generateSheetSet(graph).map((s) => s.number);

/* -------------------------------------------------------------------------- */
/* Full graph                                                                 */
/* -------------------------------------------------------------------------- */

describe("generateSheetSet — full graph", () => {
  const graph = generatePlan(brief(), 1);
  const sheets = generateSheetSet(graph);

  it("emits every standard sheet for a complete plan", () => {
    expect(sheets.map((s) => s.number)).toEqual([
      "A-000",
      "A-100",
      "A-101",
      "A-201",
      "A-301",
      "A-401",
      "A-501",
    ]);
  });

  it("renders all sheets at the ARCH-D standard size", () => {
    for (const sheet of sheets) {
      expect(sheet.size).toBe("ARCH-D");
      expect(sheet.name.length).toBeGreaterThan(0);
    }
  });

  it("titles the floor-plan sheet with the graph level", () => {
    const floorPlan = sheets.find((s) => s.number === "A-101");
    expect(floorPlan?.name).toContain(graph.level);
  });
});

/* -------------------------------------------------------------------------- */
/* Conditional sheets                                                         */
/* -------------------------------------------------------------------------- */

describe("generateSheetSet — conditional sheets", () => {
  it("emits only the general-notes sheet for an empty graph", () => {
    expect(numbersOf(emptyGraph)).toEqual(["A-000"]);
  });

  it("adds the site plan once the footprint has extents", () => {
    expect(
      numbersOf({ ...emptyGraph, bounds: { width: 8000, height: 6000 } }),
    ).toContain("A-100");
  });

  it("adds the floor plan and schedules once rooms exist", () => {
    const nums = numbersOf({
      ...emptyGraph,
      rooms: [
        {
          id: "r1",
          label: "Great Room",
          use: "great-room",
          zone: "public",
          polygon: [],
          areaSqft: 300,
          ceilingMm: 2700,
          finishFloor: "oak",
        },
      ],
    });
    expect(nums).toContain("A-101");
    expect(nums).toContain("A-401");
  });

  it("adds elevations only when an exterior wall is present", () => {
    const interiorOnly = numbersOf({
      ...emptyGraph,
      walls: [
        {
          id: "w1",
          kind: "interior",
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 },
          thicknessMm: 100,
        },
      ],
    });
    expect(interiorOnly).not.toContain("A-201");
    expect(interiorOnly).toContain("A-301"); // any wall still yields a section
  });

  it("adds enlarged plans only when a kitchen or bath exists", () => {
    expect(numbersOf(emptyGraph)).not.toContain("A-501");
  });
});
