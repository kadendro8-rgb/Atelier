import { describe, expect, it } from "vitest";
import { generateHardscape } from "./generate";
import type { HardscapeBrief, HardscapePlan, Vec2 } from "./types";

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
      { kind: "border", material: "natural-stone" },
    ],
    decor: {
      bandedBorder: true,
      borderMaterial: "natural-stone",
      medallionInlay: true,
    },
  };
}

/** Deep structural equality via JSON — the plan is plain data. */
const snapshot = (p: HardscapePlan) => JSON.stringify(p);

/* -------------------------------------------------------------------------- */
/* Determinism                                                                */
/* -------------------------------------------------------------------------- */

describe("generateHardscape — determinism", () => {
  it("produces byte-identical output for the same brief and seed", () => {
    const brief = sampleBrief();
    expect(snapshot(generateHardscape(brief, 42))).toEqual(
      snapshot(generateHardscape(brief, 42)),
    );
  });

  it("produces different output for different seeds", () => {
    const brief = sampleBrief();
    expect(snapshot(generateHardscape(brief, 1))).not.toEqual(
      snapshot(generateHardscape(brief, 2)),
    );
  });

  it("records the seed it was generated with on the plan", () => {
    expect(generateHardscape(sampleBrief(), 7).seed).toBe(7);
    expect(generateHardscape(sampleBrief(), 999).seed).toBe(999);
  });

  it("defaults to seed 1 when none is supplied", () => {
    expect(snapshot(generateHardscape(sampleBrief()))).toEqual(
      snapshot(generateHardscape(sampleBrief(), 1)),
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Structural validity                                                        */
/* -------------------------------------------------------------------------- */

describe("generateHardscape — structural validity", () => {
  const plan = generateHardscape(sampleBrief(), 42);

  it("emits a versioned plan", () => {
    expect(plan.schemaVersion).toBe(1);
  });

  it("creates one element per requested element, plus decor", () => {
    // 6 requested + banded border + medallion inlay = 8.
    expect(plan.elements).toHaveLength(8);
  });

  it("gives every element a closed quad polygon and positive area", () => {
    for (const element of plan.elements) {
      expect(element.polygon).toHaveLength(4);
      expect(element.areaSqft).toBeGreaterThan(0);
      expect(Number.isFinite(element.areaSqft)).toBe(true);
      expect(element.id).toMatch(/^hardscape-/);
      expect(element.label.length).toBeGreaterThan(0);
    }
  });

  it("keeps positive, finite site bounds", () => {
    expect(plan.bounds.width).toBeGreaterThan(0);
    expect(plan.bounds.height).toBeGreaterThan(0);
    expect(Number.isFinite(plan.bounds.width)).toBe(true);
    expect(Number.isFinite(plan.bounds.height)).toBe(true);
  });

  it("places every element inside the site bounds", () => {
    const inBounds = (p: Vec2) =>
      p.x >= -1 &&
      p.y >= -1 &&
      p.x <= plan.bounds.width + 1 &&
      p.y <= plan.bounds.height + 1;
    for (const element of plan.elements) {
      for (const vertex of element.polygon) {
        expect(inBounds(vertex)).toBe(true);
      }
    }
  });

  it("totals the area of every element", () => {
    const sum = plan.elements.reduce((s, e) => s + e.areaSqft, 0);
    expect(plan.totalAreaSqft).toBeCloseTo(Math.round(sum * 10) / 10, 1);
    expect(plan.totalAreaSqft).toBeGreaterThan(0);
  });

  it("sizes elements toward their requested target area", () => {
    const patio = plan.elements.find(
      (e) => e.kind === "patio" && e.label === "Patio",
    );
    expect(patio).toBeDefined();
    // Within ~15% of the 360 sqft target after min-dimension clamping.
    expect(patio?.areaSqft).toBeGreaterThan(360 * 0.85);
    expect(patio?.areaSqft).toBeLessThan(360 * 1.15);
  });

  it("carries the requested material onto each element", () => {
    const driveway = plan.elements.find((e) => e.kind === "driveway");
    expect(driveway?.material).toBe("broom-finish");
    const walkway = plan.elements.find((e) => e.kind === "walkway");
    expect(walkway?.material).toBe("pavers");
  });
});

/* -------------------------------------------------------------------------- */
/* Decorative options                                                         */
/* -------------------------------------------------------------------------- */

describe("generateHardscape — decorative options", () => {
  it("adds a banded border element when requested", () => {
    const plan = generateHardscape(sampleBrief(), 3);
    const border = plan.elements.find((e) => e.label === "Banded Border");
    expect(border).toBeDefined();
    expect(border?.areaSqft).toBeGreaterThan(0);
  });

  it("adds a medallion inlay element when requested", () => {
    const plan = generateHardscape(sampleBrief(), 3);
    const medallion = plan.elements.find((e) => e.label === "Medallion Inlay");
    expect(medallion).toBeDefined();
    expect(medallion?.areaSqft).toBeGreaterThan(0);
  });

  it("omits decor elements when both options are off", () => {
    const brief: HardscapeBrief = {
      schemaVersion: 1,
      elements: [{ kind: "patio", material: "broom-finish" }],
      decor: { bandedBorder: false, medallionInlay: false },
    };
    const plan = generateHardscape(brief, 1);
    expect(plan.elements).toHaveLength(1);
    expect(
      plan.elements.some(
        (e) => e.label === "Banded Border" || e.label === "Medallion Inlay",
      ),
    ).toBe(false);
  });

  it("skips the banded border when no eligible slab exists", () => {
    const brief: HardscapeBrief = {
      schemaVersion: 1,
      // Only a walkway — not border-eligible.
      elements: [{ kind: "walkway", material: "pavers" }],
      decor: { bandedBorder: true, medallionInlay: false },
    };
    const plan = generateHardscape(brief, 1);
    expect(plan.elements).toHaveLength(1);
  });

  it("falls back to natural stone for the border when unspecified", () => {
    const brief: HardscapeBrief = {
      schemaVersion: 1,
      elements: [{ kind: "patio", material: "broom-finish" }],
      decor: { bandedBorder: true, medallionInlay: false },
    };
    const plan = generateHardscape(brief, 1);
    const border = plan.elements.find((e) => e.label === "Banded Border");
    expect(border?.material).toBe("natural-stone");
  });
});

/* -------------------------------------------------------------------------- */
/* Edge cases                                                                 */
/* -------------------------------------------------------------------------- */

describe("generateHardscape — edge cases", () => {
  it("handles an empty brief without crashing", () => {
    const plan = generateHardscape(
      { schemaVersion: 1, elements: [], decor: { bandedBorder: true, medallionInlay: true } },
      5,
    );
    expect(plan.elements).toHaveLength(0);
    expect(plan.totalAreaSqft).toBe(0);
    expect(plan.bounds.width).toBeGreaterThan(0);
    expect(plan.bounds.height).toBeGreaterThan(0);
  });

  it("uses per-kind defaults when no target size is given", () => {
    const brief: HardscapeBrief = {
      schemaVersion: 1,
      elements: [{ kind: "driveway", material: "broom-finish" }],
      decor: { bandedBorder: false, medallionInlay: false },
    };
    const plan = generateHardscape(brief, 1);
    // Default driveway is 600 sqft.
    expect(plan.elements[0].areaSqft).toBeGreaterThan(600 * 0.85);
    expect(plan.elements[0].areaSqft).toBeLessThan(600 * 1.15);
  });

  it("numbers repeated element kinds in the label", () => {
    const brief: HardscapeBrief = {
      schemaVersion: 1,
      elements: [
        { kind: "patio", material: "broom-finish" },
        { kind: "patio", material: "pavers" },
      ],
      decor: { bandedBorder: false, medallionInlay: false },
    };
    const plan = generateHardscape(brief, 1);
    expect(plan.elements.map((e) => e.label)).toEqual(["Patio 1", "Patio 2"]);
  });
});
