import { describe, expect, it } from "vitest";
import { generateHardscape } from "../hardscape/generate";
import { generatePlan } from "../kernel/plan";
import type { HardscapeBrief } from "../hardscape/types";
import type { ParsedBrief } from "../kernel/types";
import { exportHardscapeDXF } from "./hardscapeDxf";
import { exportHardscapeTakeoffCsv, exportHomeTakeoffCsv } from "./takeoffCsv";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

function hardscapeBrief(): HardscapeBrief {
  return {
    schemaVersion: 1,
    elements: [
      { kind: "driveway", material: "broom-finish", targetSqft: 640 },
      { kind: "walkway", material: "pavers", targetSqft: 140 },
      { kind: "patio", material: "stamped-concrete", targetSqft: 360 },
    ],
    decor: { bandedBorder: true, borderMaterial: "natural-stone", medallionInlay: false },
  };
}

function homeBrief(): ParsedBrief {
  return {
    totalSqft: 1800,
    stories: 1,
    rooms: [
      { use: "great-room", count: 1, minSqft: 300, maxSqft: 420 },
      { use: "kitchen", count: 1, minSqft: 180, maxSqft: 260 },
      { use: "bedroom", count: 2, minSqft: 120, maxSqft: 180 },
      { use: "bathroom", count: 2, minSqft: 60, maxSqft: 100 },
    ],
    adjacencies: [],
    roof: "gable",
    lotOrientation: "S",
  };
}

/* -------------------------------------------------------------------------- */
/* Hardscape DXF                                                              */
/* -------------------------------------------------------------------------- */

describe("exportHardscapeDXF", () => {
  it("emits a structurally valid R12 DXF with sections", () => {
    const dxf = exportHardscapeDXF(generateHardscape(hardscapeBrief(), 7));
    expect(dxf).toContain("SECTION");
    expect(dxf.trim().endsWith("EOF")).toBe(true);
    expect(dxf).toContain("ENTITIES");
  });

  it("draws each element as a polyline and labels it as text", () => {
    const plan = generateHardscape(hardscapeBrief(), 7);
    const dxf = exportHardscapeDXF(plan);
    expect(dxf).toContain("POLYLINE");
    expect(dxf).toContain("TEXT");
    // Every element's label should appear in the annotation text.
    for (const el of plan.elements) {
      expect(dxf).toContain(el.label);
    }
  });

  it("declares a layer per element kind that is present", () => {
    const plan = generateHardscape(hardscapeBrief(), 7);
    const dxf = exportHardscapeDXF(plan);
    if (plan.elements.some((e) => e.kind === "driveway")) {
      expect(dxf).toContain("HS-DRIVEWAY");
    }
    expect(dxf).toContain("HS-ANNO");
  });
});

/* -------------------------------------------------------------------------- */
/* Takeoff CSV                                                                */
/* -------------------------------------------------------------------------- */

describe("exportHardscapeTakeoffCsv", () => {
  it("has a header row and one row per element plus a total", () => {
    const plan = generateHardscape(hardscapeBrief(), 7);
    const csv = exportHardscapeTakeoffCsv(plan);
    const rows = csv.trim().split("\r\n");
    expect(rows[0]).toContain("Element");
    expect(rows[0]).toContain("Material");
    expect(rows.length).toBe(plan.elements.length + 2);
    expect(rows[rows.length - 1].startsWith("Total")).toBe(true);
  });

  it("totals the per-element low cost", () => {
    const plan = generateHardscape(hardscapeBrief(), 7);
    const csv = exportHardscapeTakeoffCsv(plan);
    const rows = csv.trim().split("\r\n");
    const dataRows = rows.slice(1, -1);
    const sumLow = dataRows.reduce((s, r) => s + Number(r.split(",")[4]), 0);
    const totalLow = Number(rows[rows.length - 1].split(",")[4]);
    expect(totalLow).toBe(sumLow);
  });
});

describe("exportHomeTakeoffCsv", () => {
  it("has a header row and one row per room plus a total", () => {
    const graph = generatePlan(homeBrief(), 1);
    const csv = exportHomeTakeoffCsv(graph);
    const rows = csv.trim().split("\r\n");
    expect(rows[0]).toContain("Room");
    expect(rows[0]).toContain("Finished area (sq ft)");
    expect(rows.length).toBe(graph.rooms.length + 2);
    expect(rows[rows.length - 1].startsWith("Total")).toBe(true);
  });

  it("escapes a comma in a room label", () => {
    const graph = generatePlan(homeBrief(), 1);
    const tweaked = {
      ...graph,
      rooms: graph.rooms.map((r, i) =>
        i === 0 ? { ...r, label: "Great Room, Main" } : r,
      ),
    };
    const csv = exportHomeTakeoffCsv(tweaked);
    expect(csv).toContain('"Great Room, Main"');
  });
});
