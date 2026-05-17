import rhino3dm from "rhino3dm";
import { describe, expect, it } from "vitest";
import { generateHardscape } from "../hardscape/generate";
import { generatePlan } from "../kernel/plan";
import type { HardscapeBrief } from "../hardscape/types";
import type { ParsedBrief } from "../kernel/types";
import { exportHardscapeRhino3dm, exportHomeRhino3dm } from "./rhino3dm";

/* -------------------------------------------------------------------------- */
/* Fixtures — shared shapes mirroring exports.test.ts                          */
/* -------------------------------------------------------------------------- */

function hardscapeBrief(): HardscapeBrief {
  return {
    schemaVersion: 1,
    elements: [
      { kind: "driveway", material: "broom-finish", targetSqft: 640 },
      { kind: "walkway", material: "pavers", targetSqft: 140 },
      { kind: "patio", material: "stamped-concrete", targetSqft: 360 },
    ],
    decor: {
      bandedBorder: true,
      borderMaterial: "natural-stone",
      medallionInlay: false,
    },
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
/* Home .3dm export — write → read back → assert                               */
/* -------------------------------------------------------------------------- */

describe("exportHomeRhino3dm", () => {
  it("writes a structurally valid .3dm that round-trips through rhino3dm", async () => {
    const graph = generatePlan(homeBrief(), 1);
    const bytes = await exportHomeRhino3dm(graph);
    expect(bytes).not.toBeNull();
    expect(bytes!.byteLength).toBeGreaterThan(0);

    // Read the archive back with a fresh rhino3dm instance.
    const rhino = await rhino3dm();
    const doc = rhino.File3dm.fromByteArray(bytes!);
    expect(doc).not.toBeNull();

    // Every wall, room and opening becomes one curve object, plus the
    // building-outline rectangle.
    const expectedObjects =
      graph.walls.length + graph.rooms.length + graph.openings.length + 1;
    expect(doc.objects().count).toBe(expectedObjects);

    // Layers survive the round-trip.
    expect(doc.layers().count).toBeGreaterThanOrEqual(1);
    const layerNames: string[] = [];
    for (let i = 0; i < doc.layers().count; i++) {
      layerNames.push(doc.layers().get(i).name);
    }
    expect(layerNames).toContain("Building Outline");
  });

  it("declares millimeter model units", async () => {
    const bytes = await exportHomeRhino3dm(generatePlan(homeBrief(), 2));
    const rhino = await rhino3dm();
    const doc = rhino.File3dm.fromByteArray(bytes!);
    // rhino3dm round-trips the unit system as its enum member object.
    expect(doc.settings().modelUnitSystem).toBe(rhino.UnitSystem.Millimeters);
  });

  it("names objects after their plan elements", async () => {
    const graph = generatePlan(homeBrief(), 3);
    const bytes = await exportHomeRhino3dm(graph);
    const rhino = await rhino3dm();
    const doc = rhino.File3dm.fromByteArray(bytes!);
    const names: string[] = [];
    const table = doc.objects();
    for (let i = 0; i < table.count; i++) {
      names.push(table.get(i).attributes().name);
    }
    expect(names).toContain("Building outline");
    // At least one room object carries its label + area.
    expect(names.some((n) => n.includes("SF"))).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Hardscape .3dm export                                                       */
/* -------------------------------------------------------------------------- */

describe("exportHardscapeRhino3dm", () => {
  it("writes a .3dm with one curve per hardscape element", async () => {
    const plan = generateHardscape(hardscapeBrief(), 7);
    const bytes = await exportHardscapeRhino3dm(plan);
    expect(bytes).not.toBeNull();

    const rhino = await rhino3dm();
    const doc = rhino.File3dm.fromByteArray(bytes!);
    // Every element with a valid ring becomes exactly one curve.
    const ringed = plan.elements.filter((e) => e.polygon.length >= 3).length;
    expect(doc.objects().count).toBe(ringed);
  });

  it("only registers layers for element kinds present in the plan", async () => {
    const plan = generateHardscape(hardscapeBrief(), 7);
    const bytes = await exportHardscapeRhino3dm(plan);
    const rhino = await rhino3dm();
    const doc = rhino.File3dm.fromByteArray(bytes!);

    const presentKinds = new Set(plan.elements.map((e) => e.kind));
    expect(doc.layers().count).toBe(presentKinds.size);

    const layerNames: string[] = [];
    for (let i = 0; i < doc.layers().count; i++) {
      layerNames.push(doc.layers().get(i).name);
    }
    if (presentKinds.has("driveway")) {
      expect(layerNames).toContain("Hardscape — Driveway");
    }
  });
});
