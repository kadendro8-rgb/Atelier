import { describe, expect, it } from "vitest";
import { priceProject } from "./pricing";

describe("priceProject", () => {
  it("derives all three figures from square footage", () => {
    const p = priceProject(2800);
    // 2800 * $3 = $8,400 ; 2800 * $220 = $616,000.
    expect(p.designFeeCents).toBe(840_000);
    expect(p.constructionEstimateCents).toBe(61_600_000);
  });

  it("sets the deposit to the design fee", () => {
    const p = priceProject(2400);
    expect(p.depositCents).toBe(p.designFeeCents);
  });

  it("scales with home size", () => {
    expect(priceProject(4000).constructionEstimateCents).toBeGreaterThan(
      priceProject(1500).constructionEstimateCents,
    );
  });

  it("always yields whole-cent integers", () => {
    for (const sqft of [999, 1234, 2750, 8001]) {
      const p = priceProject(sqft);
      expect(Number.isInteger(p.designFeeCents)).toBe(true);
      expect(Number.isInteger(p.constructionEstimateCents)).toBe(true);
    }
  });

  it("zeroes the estimate for non-positive or non-finite input", () => {
    for (const bad of [0, -500, NaN, Infinity]) {
      const p = priceProject(bad);
      expect(p).toEqual({
        designFeeCents: 0,
        depositCents: 0,
        constructionEstimateCents: 0,
      });
    }
  });
});
