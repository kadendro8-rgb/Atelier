import { describe, expect, it } from "vitest";
import { generatePlan } from "@/lib/kernel/plan";
import type { ParsedBrief } from "@/lib/kernel/types";
import { exportIFC4 } from "./ifc4";

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
      { use: "bathroom", count: 1, minSqft: 50, maxSqft: 90 },
    ],
    adjacencies: [],
    roof: "hip",
    lotOrientation: "S",
  };
}

const graph = generatePlan(brief(), 7);
const ifc = exportIFC4(graph);

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

/* -------------------------------------------------------------------------- */
/* STEP-21 envelope                                                           */
/* -------------------------------------------------------------------------- */

describe("exportIFC4 — STEP-21 envelope", () => {
  it("opens and closes the ISO-10303-21 file envelope", () => {
    expect(ifc.startsWith("ISO-10303-21;")).toBe(true);
    expect(ifc.trimEnd().endsWith("END-ISO-10303-21;")).toBe(true);
  });

  it("declares the IFC4 schema", () => {
    expect(ifc).toContain("FILE_SCHEMA(('IFC4'))");
  });

  it("contains both a HEADER and a DATA section", () => {
    expect(ifc).toContain("HEADER;");
    expect(ifc).toContain("DATA;");
    expect(count(ifc, /ENDSEC;/g)).toBe(2);
  });
});

/* -------------------------------------------------------------------------- */
/* Spatial hierarchy                                                          */
/* -------------------------------------------------------------------------- */

describe("exportIFC4 — spatial hierarchy", () => {
  it("emits exactly one of each spatial container", () => {
    expect(count(ifc, /=\s*IFCPROJECT\(/g)).toBe(1);
    expect(count(ifc, /=\s*IFCSITE\(/g)).toBe(1);
    expect(count(ifc, /=\s*IFCBUILDING\(/g)).toBe(1);
    expect(count(ifc, /=\s*IFCBUILDINGSTOREY\(/g)).toBe(1);
  });

  it("aggregates the hierarchy with three IfcRelAggregates links", () => {
    expect(count(ifc, /=\s*IFCRELAGGREGATES\(/g)).toBe(3);
  });

  it("names the storey after the graph level", () => {
    expect(ifc).toContain(`'${graph.level}'`);
  });
});

/* -------------------------------------------------------------------------- */
/* Building elements                                                          */
/* -------------------------------------------------------------------------- */

describe("exportIFC4 — building elements", () => {
  it("emits one IfcWall per graph wall", () => {
    expect(count(ifc, /=\s*IFCWALL\(/g)).toBe(graph.walls.length);
  });

  it("emits exactly one floor slab", () => {
    expect(count(ifc, /=\s*IFCSLAB\(/g)).toBe(1);
  });

  it("contains every physical element in the storey", () => {
    expect(count(ifc, /=\s*IFCRELCONTAINEDINSPATIALSTRUCTURE\(/g)).toBe(1);
  });

  it("declares millimetre length units to match the kernel", () => {
    expect(ifc).toContain("IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)");
  });
});

/* -------------------------------------------------------------------------- */
/* Globally unique ids                                                        */
/* -------------------------------------------------------------------------- */

describe("exportIFC4 — IfcGloballyUniqueId", () => {
  it("uses 22-character base-64 ids on the project entity", () => {
    const project = ifc.match(/IFCPROJECT\('([^']+)'/);
    expect(project).not.toBeNull();
    expect(project![1]).toMatch(/^[0-9A-Za-z_$]{22}$/);
  });
});

/* -------------------------------------------------------------------------- */
/* Stability                                                                  */
/* -------------------------------------------------------------------------- */

describe("exportIFC4 — structural stability", () => {
  it("emits the same entity-type counts on every run", () => {
    // GUIDs come from a module-level counter so the bytes differ run-to-run;
    // the entity-type histogram is the stable contract worth pinning.
    const a = exportIFC4(graph);
    const b = exportIFC4(graph);
    const histogram = (s: string) => ({
      wall: count(s, /=\s*IFCWALL\(/g),
      slab: count(s, /=\s*IFCSLAB\(/g),
      project: count(s, /=\s*IFCPROJECT\(/g),
      lines: s.split("\n").length,
    });
    expect(histogram(a)).toEqual(histogram(b));
  });
});
