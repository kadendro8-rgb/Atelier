import { describe, expect, it } from "vitest";
import { generatePlan } from "@/lib/kernel/plan";
import type { ParsedBrief } from "@/lib/kernel/types";
import { exportDWG } from "./dwg";

/* -------------------------------------------------------------------------- */
/* Fixture                                                                    */
/* -------------------------------------------------------------------------- */

function brief(): ParsedBrief {
  return {
    totalSqft: 1600,
    stories: 1,
    rooms: [
      { use: "great-room", count: 1, minSqft: 280, maxSqft: 400 },
      { use: "kitchen", count: 1, minSqft: 170, maxSqft: 240 },
      { use: "primary-suite", count: 1, minSqft: 220, maxSqft: 300 },
      { use: "bedroom", count: 1, minSqft: 120, maxSqft: 170 },
      { use: "bathroom", count: 1, minSqft: 50, maxSqft: 90 },
      { use: "garage", count: 1, minSqft: 380, maxSqft: 520 },
    ],
    adjacencies: [],
    roof: "gable",
    lotOrientation: "S",
  };
}

const graph = generatePlan(brief(), 42);

/**
 * Mask DXF handle values so output can be compared run-to-run.
 *
 * `dxf-writer` draws handles from a process-global counter, so the hex handle
 * literals (group codes 5/105 and the 330-series owner pointers) differ on
 * every call even for an identical graph. Replacing those values isolates the
 * geometry/layer payload — the part that actually matters for the export.
 */
function normalizeDxf(dxf: string): string {
  const handleCodes = new Set(["5", "105", "330", "331", "340", "350", "360"]);
  const lines = dxf.split("\n");
  for (let i = 0; i + 1 < lines.length; i += 2) {
    if (handleCodes.has(lines[i].trim())) lines[i + 1] = "<HANDLE>";
  }
  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/* Output contract                                                            */
/* -------------------------------------------------------------------------- */

describe("exportDWG — DXF structure", () => {
  const dxf = exportDWG(graph);

  it("emits a well-formed DXF document", () => {
    expect(dxf).toContain("SECTION");
    expect(dxf).toContain("ENTITIES");
    expect(dxf.trimEnd().endsWith("EOF")).toBe(true);
  });

  it("declares all five AIA CAD-standard layers", () => {
    for (const layer of [
      "A-WALL",
      "A-WALL-EXT",
      "A-DOOR",
      "A-WIND",
      "A-ANNO",
    ]) {
      expect(dxf).toContain(layer);
    }
  });

  it("labels every room with its name and rounded area", () => {
    for (const room of graph.rooms) {
      expect(dxf).toContain(`${room.label} (${Math.round(room.areaSqft)} SF)`);
    }
  });
});

describe("exportDWG — determinism", () => {
  it("produces identical DXF geometry for the same graph", () => {
    expect(normalizeDxf(exportDWG(graph))).toEqual(
      normalizeDxf(exportDWG(graph)),
    );
  });

  it("matches the recorded DXF snapshot", () => {
    // Locks the export format: a diff here flags a dxf-writer upgrade or an
    // unintended change to the emitted geometry/layers. Handles are masked
    // because they come from a process-global counter.
    expect(normalizeDxf(exportDWG(graph))).toMatchSnapshot();
  });
});

describe("exportDWG — degenerate input", () => {
  it("handles an empty graph without throwing", () => {
    const empty = generatePlan(
      {
        totalSqft: 200,
        stories: 1,
        rooms: [{ use: "great-room", count: 1, minSqft: 180, maxSqft: 220 }],
        adjacencies: [],
        roof: "flat",
        lotOrientation: "N",
      },
      1,
    );
    expect(() => exportDWG(empty)).not.toThrow();
  });
});
