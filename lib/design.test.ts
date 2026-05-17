import { describe, expect, it } from "vitest";
import {
  STYLE_IDS,
  STYLES,
  buildDesign,
  buildFloorPlan,
  normalizeParams,
  parseBriefLocally,
  type BriefParams,
  type PlanOptions,
} from "./design";

/* ========================================================================== */
/* parseBriefLocally                                                          */
/* ========================================================================== */

describe("parseBriefLocally — defaults", () => {
  it("produces a complete brief for an empty string", () => {
    const p = parseBriefLocally("");
    expect(p.style).toBe("modern-farmhouse");
    expect(p.beds).toBe(4);
    expect(p.baths).toBe(3); // max(2, beds - 1)
    expect(p.sqft).toBe(2900); // 2400 + (4 - 3) * 500
    expect(p.stories).toBe(1);
    expect(p.garageBays).toBe(2);
    expect(p.lotAcres).toBe(0.5);
    expect(p.features).toEqual([]);
    expect(p.summary).toBe("Custom home");
  });
});

describe("parseBriefLocally — extraction", () => {
  it("matches style keywords to a StyleId", () => {
    expect(parseBriefLocally("a cozy mountain cabin").style).toBe("mountain-cabin");
    expect(parseBriefLocally("urban infill townhouse").style).toBe("urban-infill");
    expect(parseBriefLocally("courtyard home").style).toBe("courtyard-modern");
  });

  it("clamps bedrooms to the 3–5 band", () => {
    expect(parseBriefLocally("2 bedroom").beds).toBe(3);
    expect(parseBriefLocally("9 bedroom").beds).toBe(5);
  });

  it("reads square footage and clamps it to 900–9000", () => {
    expect(parseBriefLocally("3,500 sq ft").sqft).toBe(3500);
    expect(parseBriefLocally("99999 square feet").sqft).toBe(9000);
  });

  it("detects multi-story briefs", () => {
    expect(parseBriefLocally("two-story").stories).toBe(2);
    expect(parseBriefLocally("3 story walk-up").stories).toBe(3);
  });

  it("lets a ranch keyword force a single story", () => {
    // The `ranch` rule runs last and overrides an earlier two-story match.
    expect(parseBriefLocally("two-story ranch").stories).toBe(1);
  });

  it("detects a three-car garage", () => {
    expect(parseBriefLocally("with a 3-car garage").garageBays).toBe(3);
    expect(parseBriefLocally("two car garage").garageBays).toBe(2);
  });

  it("reads and clamps the lot size", () => {
    expect(parseBriefLocally("on 2.5 acres").lotAcres).toBe(2.5);
    expect(parseBriefLocally("on 999 acres").lotAcres).toBe(40);
  });

  it("collects recognised feature phrases", () => {
    const p = parseBriefLocally("vaulted great room with a home office and pool");
    expect(p.features).toContain("Vaulted great room");
    expect(p.features).toContain("Home office");
    expect(p.features).toContain("Pool-ready site plan");
  });

  it("truncates the summary to 180 characters", () => {
    expect(parseBriefLocally("x".repeat(500)).summary.length).toBe(180);
  });
});

/* ========================================================================== */
/* normalizeParams                                                            */
/* ========================================================================== */

describe("normalizeParams", () => {
  it("returns the local parse when raw is not an object", () => {
    const brief = "modern farmhouse, 4 bed";
    expect(normalizeParams(null, brief)).toEqual(parseBriefLocally(brief));
    expect(normalizeParams("oops", brief)).toEqual(parseBriefLocally(brief));
  });

  it("rejects an unknown style and falls back", () => {
    const brief = "a lake home";
    const r = normalizeParams({ style: "not-a-style" }, brief);
    expect(r.style).toBe("lake-home");
  });

  it("accepts a known style id", () => {
    const r = normalizeParams({ style: "desert-contemporary" }, "anything");
    expect(r.style).toBe("desert-contemporary");
  });

  it("rounds and clamps numeric fields", () => {
    const r = normalizeParams(
      { sqft: 50, beds: 9.6, baths: 99, stories: 7, garageBays: 0, lotAcres: 0 },
      "brief",
    );
    expect(r.sqft).toBe(900); // clamp lo
    expect(r.beds).toBe(5); // clamp hi
    expect(r.baths).toBe(7); // clamp hi
    expect(r.stories).toBe(3); // clamp hi
    expect(r.garageBays).toBe(2); // clamp lo
    expect(r.lotAcres).toBe(0.05); // clamp lo
  });

  it("filters non-string feature entries and caps at eight", () => {
    const r = normalizeParams(
      { features: ["a", 2, "b", null, "c", "d", "e", "f", "g", "h"] },
      "brief",
    );
    expect(r.features.every((f) => typeof f === "string")).toBe(true);
    expect(r.features.length).toBeLessThanOrEqual(8);
  });

  it("ignores a blank summary and keeps the fallback", () => {
    const brief = "coastal cottage retreat";
    const r = normalizeParams({ summary: "   " }, brief);
    expect(r.summary).toBe(parseBriefLocally(brief).summary);
  });
});

/* ========================================================================== */
/* buildDesign                                                                */
/* ========================================================================== */

function sampleParams(overrides: Partial<BriefParams> = {}): BriefParams {
  return {
    style: "modern-farmhouse",
    sqft: 2400,
    beds: 4,
    baths: 3,
    stories: 1,
    garageBays: 2,
    lotAcres: 0.5,
    features: [],
    summary: "A modern farmhouse",
    ...overrides,
  };
}

describe("buildDesign", () => {
  it("is deterministic for identical params", () => {
    expect(buildDesign(sampleParams())).toEqual(buildDesign(sampleParams()));
  });

  it("prices the design deposit from square footage", () => {
    // round(2400 * 2.9 / 250) * 250 = 7000.
    const d = buildDesign(sampleParams({ sqft: 2400 }));
    expect(d.pricing.consultation).toBe(850);
    expect(d.pricing.designDeposit).toBe(7000);
    expect(d.pricing.total).toBe(7850);
  });

  it("scales the deposit with a larger home", () => {
    const small = buildDesign(sampleParams({ sqft: 1200 }));
    const large = buildDesign(sampleParams({ sqft: 6000 }));
    expect(large.pricing.designDeposit).toBeGreaterThan(
      small.pricing.designDeposit,
    );
  });

  it("leads the render list with the chosen style image", () => {
    const d = buildDesign(sampleParams({ style: "lake-home" }));
    const lake = STYLES.find((s) => s.id === "lake-home")!;
    expect(d.renders[0]).toBe(lake.image);
    expect(d.renders.length).toBe(6);
  });

  it("derives a project name ending in the style word", () => {
    const d = buildDesign(sampleParams({ style: "mountain-cabin" }));
    expect(d.projectName).toMatch(/Cabin$/);
  });
});

/* ========================================================================== */
/* buildFloorPlan                                                             */
/* ========================================================================== */

const opts = (o: Partial<PlanOptions> = {}): PlanOptions => ({
  garageBays: 2,
  porch: false,
  office: false,
  ...o,
});

describe("buildFloorPlan", () => {
  it("widens the footprint for a three-car garage", () => {
    const two = buildFloorPlan(sampleParams(), opts({ garageBays: 2 }));
    const three = buildFloorPlan(sampleParams(), opts({ garageBays: 3 }));
    expect(three.width).toBeGreaterThan(two.width);
  });

  it("emits one secondary bedroom per bed beyond the primary", () => {
    const plan = buildFloorPlan(sampleParams({ beds: 5 }), opts());
    const beds = plan.rooms.filter((r) => r.id.startsWith("bed-"));
    expect(beds).toHaveLength(4);
    expect(beds.map((b) => b.id)).toEqual(["bed-2", "bed-3", "bed-4", "bed-5"]);
  });

  it("adds a study only when the office option is set", () => {
    expect(
      buildFloorPlan(sampleParams(), opts({ office: false })).rooms.some(
        (r) => r.id === "study",
      ),
    ).toBe(false);
    expect(
      buildFloorPlan(sampleParams(), opts({ office: true })).rooms.some(
        (r) => r.id === "study",
      ),
    ).toBe(true);
  });

  it("adds a porch and grows the height when the porch option is set", () => {
    const noPorch = buildFloorPlan(sampleParams(), opts({ porch: false }));
    const porch = buildFloorPlan(sampleParams(), opts({ porch: true }));
    expect(porch.height).toBeGreaterThan(noPorch.height);
    expect(porch.rooms.some((r) => r.id === "porch")).toBe(true);
  });

  it("labels the great room as vaulted when the feature is present", () => {
    const plan = buildFloorPlan(
      sampleParams({ features: ["Vaulted great room"] }),
      opts(),
    );
    expect(plan.rooms.find((r) => r.id === "great")?.label).toBe(
      "Vaulted Great Room",
    );
  });

  it("annotates the level string for multi-story homes", () => {
    expect(buildFloorPlan(sampleParams({ stories: 1 }), opts()).level).toBe(
      "Main level",
    );
    expect(buildFloorPlan(sampleParams({ stories: 2 }), opts()).level).toContain(
      "1 of 2",
    );
  });

  it("keeps every room within the reported plan extents", () => {
    const plan = buildFloorPlan(sampleParams({ beds: 5 }), opts({ porch: true }));
    for (const r of plan.rooms) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(plan.width + 0.01);
      expect(r.y + r.h).toBeLessThanOrEqual(plan.height + 0.01);
    }
  });
});

/* ========================================================================== */
/* Static catalogue                                                          */
/* ========================================================================== */

describe("STYLES catalogue", () => {
  it("exposes a stable list of unique style ids", () => {
    expect(STYLE_IDS).toEqual(STYLES.map((s) => s.id));
    expect(new Set(STYLE_IDS).size).toBe(STYLE_IDS.length);
  });
});
