import { describe, expect, it } from "vitest";
import { estimateCost } from "./cost";
import { generateHardscape } from "./generate";
import type { HardscapeBrief, HardscapePlan } from "./types";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

function sampleBrief(): HardscapeBrief {
  return {
    schemaVersion: 1,
    elements: [
      { kind: "driveway", material: "broom-finish", targetSqft: 640 },
      { kind: "walkway", material: "pavers", targetSqft: 140 },
      { kind: "patio", material: "stamped-concrete", targetSqft: 360 },
    ],
    decor: { bandedBorder: false, medallionInlay: false },
  };
}

const samplePlan = (): HardscapePlan => generateHardscape(sampleBrief(), 42);

/* -------------------------------------------------------------------------- */
/* Cost behaviour                                                             */
/* -------------------------------------------------------------------------- */

describe("estimateCost — basic behaviour", () => {
  it("returns a non-negative low/high range", () => {
    const { lowCents, highCents } = estimateCost(samplePlan());
    expect(lowCents).toBeGreaterThan(0);
    expect(highCents).toBeGreaterThan(0);
  });

  it("never returns a low greater than the high", () => {
    const { lowCents, highCents } = estimateCost(samplePlan());
    expect(lowCents).toBeLessThanOrEqual(highCents);
  });

  it("returns whole-cent integers", () => {
    const { lowCents, highCents } = estimateCost(samplePlan());
    expect(Number.isInteger(lowCents)).toBe(true);
    expect(Number.isInteger(highCents)).toBe(true);
  });

  it("is deterministic for a given plan", () => {
    const plan = samplePlan();
    expect(estimateCost(plan)).toEqual(estimateCost(plan));
  });

  it("costs an empty plan at zero", () => {
    const plan = generateHardscape(
      {
        schemaVersion: 1,
        elements: [],
        decor: { bandedBorder: false, medallionInlay: false },
      },
      1,
    );
    expect(estimateCost(plan)).toEqual({ lowCents: 0, highCents: 0 });
  });
});

/* -------------------------------------------------------------------------- */
/* Monotonicity                                                               */
/* -------------------------------------------------------------------------- */

describe("estimateCost — monotonic with area", () => {
  it("costs a larger element more than a smaller one of the same material", () => {
    const small = generateHardscape(
      {
        schemaVersion: 1,
        elements: [{ kind: "patio", material: "broom-finish", targetSqft: 200 }],
        decor: { bandedBorder: false, medallionInlay: false },
      },
      1,
    );
    const large = generateHardscape(
      {
        schemaVersion: 1,
        elements: [{ kind: "patio", material: "broom-finish", targetSqft: 600 }],
        decor: { bandedBorder: false, medallionInlay: false },
      },
      1,
    );
    const smallCost = estimateCost(small);
    const largeCost = estimateCost(large);
    expect(largeCost.lowCents).toBeGreaterThan(smallCost.lowCents);
    expect(largeCost.highCents).toBeGreaterThan(smallCost.highCents);
  });

  it("costs more when an element is added to a plan", () => {
    const onePatio = generateHardscape(
      {
        schemaVersion: 1,
        elements: [{ kind: "patio", material: "broom-finish", targetSqft: 300 }],
        decor: { bandedBorder: false, medallionInlay: false },
      },
      1,
    );
    const twoPatios = generateHardscape(
      {
        schemaVersion: 1,
        elements: [
          { kind: "patio", material: "broom-finish", targetSqft: 300 },
          { kind: "walkway", material: "broom-finish", targetSqft: 100 },
        ],
        decor: { bandedBorder: false, medallionInlay: false },
      },
      1,
    );
    expect(estimateCost(twoPatios).lowCents).toBeGreaterThan(
      estimateCost(onePatio).lowCents,
    );
    expect(estimateCost(twoPatios).highCents).toBeGreaterThan(
      estimateCost(onePatio).highCents,
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Material sensitivity                                                       */
/* -------------------------------------------------------------------------- */

describe("estimateCost — material sensitivity", () => {
  it("costs natural stone more than broom-finish at the same area", () => {
    const cheap = generateHardscape(
      {
        schemaVersion: 1,
        elements: [{ kind: "patio", material: "broom-finish", targetSqft: 400 }],
        decor: { bandedBorder: false, medallionInlay: false },
      },
      1,
    );
    const pricey = generateHardscape(
      {
        schemaVersion: 1,
        elements: [{ kind: "patio", material: "natural-stone", targetSqft: 400 }],
        decor: { bandedBorder: false, medallionInlay: false },
      },
      1,
    );
    expect(estimateCost(pricey).lowCents).toBeGreaterThan(
      estimateCost(cheap).lowCents,
    );
    expect(estimateCost(pricey).highCents).toBeGreaterThan(
      estimateCost(cheap).highCents,
    );
  });

  it("scales cost roughly linearly with element area", () => {
    const base = generateHardscape(
      {
        schemaVersion: 1,
        elements: [{ kind: "patio", material: "broom-finish", targetSqft: 200 }],
        decor: { bandedBorder: false, medallionInlay: false },
      },
      1,
    );
    const doubled = generateHardscape(
      {
        schemaVersion: 1,
        elements: [{ kind: "patio", material: "broom-finish", targetSqft: 400 }],
        decor: { bandedBorder: false, medallionInlay: false },
      },
      1,
    );
    const ratio = estimateCost(doubled).lowCents / estimateCost(base).lowCents;
    // Area roughly doubled, so cost ratio should sit close to 2x.
    expect(ratio).toBeGreaterThan(1.7);
    expect(ratio).toBeLessThan(2.3);
  });
});
