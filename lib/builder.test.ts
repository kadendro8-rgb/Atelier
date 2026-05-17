import { describe, expect, it } from "vitest";
import {
  coerceParsedRequirements,
  parseBriefFallback,
  type ParsedRequirements,
} from "./builder";

/* ========================================================================== */
/* parseBriefFallback                                                         */
/* ========================================================================== */

describe("parseBriefFallback — defaults", () => {
  it("falls back to a sensible 3-bed brief for an empty string", () => {
    const r = parseBriefFallback("");
    expect(r.beds).toBe(3);
    // baths default = max(2, beds - 1).
    expect(r.baths).toBe(2);
    // sqft default = 1500 + beds * 400.
    expect(r.sqft).toBe(2700);
    expect(r.story_count).toBe(1);
    expect(r.style).toBe("transitional");
    expect(r.lot_size).toBe("0.5 acres");
    expect(r.must_haves).toEqual([]);
    expect(r.optional_features).toEqual([]);
    expect(r.code_jurisdiction_hint).toBe("IRC 2021");
  });
});

describe("parseBriefFallback — numeric extraction", () => {
  it("reads an explicit bedroom count", () => {
    expect(parseBriefFallback("a 4 bedroom house").beds).toBe(4);
    expect(parseBriefFallback("5-bed retreat").beds).toBe(5);
  });

  it("clamps the bedroom count to 1–8", () => {
    expect(parseBriefFallback("99 bedrooms").beds).toBe(8);
  });

  it("reads a fractional bathroom count", () => {
    expect(parseBriefFallback("3 bed 2.5 bath").baths).toBe(2.5);
  });

  it("derives baths from beds when unstated", () => {
    expect(parseBriefFallback("6 bedroom").baths).toBe(5);
  });

  it("reads and de-commas a square-foot target", () => {
    expect(parseBriefFallback("around 3,200 sq ft").sqft).toBe(3200);
    expect(parseBriefFallback("2400 square feet").sqft).toBe(2400);
  });

  it("clamps square footage to the 600–12000 band", () => {
    expect(parseBriefFallback("999999 sf").sqft).toBe(12000);
  });
});

describe("parseBriefFallback — story count", () => {
  it("detects two-story briefs", () => {
    expect(parseBriefFallback("a two-story colonial").story_count).toBe(2);
    expect(parseBriefFallback("2 story home").story_count).toBe(2);
  });

  it("treats a walkout as a second story", () => {
    expect(parseBriefFallback("ranch with a walkout basement").story_count).toBe(2);
  });

  it("detects three-story briefs", () => {
    expect(parseBriefFallback("a 3-story townhouse").story_count).toBe(3);
  });

  it("defaults to a single story", () => {
    expect(parseBriefFallback("a simple cottage").story_count).toBe(1);
  });
});

describe("parseBriefFallback — style and lot", () => {
  it("maps style keywords to a canonical style", () => {
    expect(parseBriefFallback("modern farmhouse").style).toBe("modern farmhouse");
    expect(parseBriefFallback("a lakefront retreat").style).toBe("lake home");
    expect(parseBriefFallback("desert adobe").style).toBe("desert contemporary");
  });

  it("returns the transitional default for an unrecognised style", () => {
    expect(parseBriefFallback("just a regular house").style).toBe("transitional");
  });

  it("reads an explicit lot size", () => {
    expect(parseBriefFallback("on 1.5 acres").lot_size).toBe("1.5 acres");
  });
});

describe("parseBriefFallback — feature extraction", () => {
  it("collects matched features, de-duplicated", () => {
    const r = parseBriefFallback("vaulted great room with a covered porch");
    expect(r.must_haves).toContain("vaulted great room");
    expect(r.must_haves).toContain("covered porch");
  });

  it("caps the feature list at six entries", () => {
    const r = parseBriefFallback(
      "vaulted porch office walkout pool open-concept screened window wall",
    );
    expect(r.must_haves.length).toBeLessThanOrEqual(6);
  });
});

/* ========================================================================== */
/* coerceParsedRequirements                                                   */
/* ========================================================================== */

describe("coerceParsedRequirements — fallback behaviour", () => {
  it("returns the keyword parse when raw is not an object", () => {
    const brief = "4 bedroom modern farmhouse";
    const fb = parseBriefFallback(brief);
    expect(coerceParsedRequirements(null, brief)).toEqual(fb);
    expect(coerceParsedRequirements("nonsense", brief)).toEqual(fb);
    expect(coerceParsedRequirements(42, brief)).toEqual(fb);
  });

  it("falls back per-field for missing or mistyped values", () => {
    const brief = "3 bedroom cottage";
    const fb = parseBriefFallback(brief);
    const r = coerceParsedRequirements(
      { sqft: "not a number", beds: null, style: "   " },
      brief,
    );
    expect(r.sqft).toBe(fb.sqft);
    expect(r.beds).toBe(fb.beds);
    expect(r.style).toBe(fb.style);
  });
});

describe("coerceParsedRequirements — accepted values", () => {
  it("keeps well-formed fields from the raw payload", () => {
    const r = coerceParsedRequirements(
      {
        sqft: 3210.7,
        beds: 4.2,
        baths: 3.5,
        style: "  craftsman  ",
        story_count: 2,
        lot_size: "0.75 acres",
        must_haves: ["porch", "office"],
        optional_features: ["pool"],
        code_jurisdiction_hint: "IRC 2024",
      },
      "some brief",
    );
    expect(r.sqft).toBe(3211); // rounded
    expect(r.beds).toBe(4); // rounded
    expect(r.baths).toBe(3.5); // not rounded
    expect(r.style).toBe("craftsman"); // trimmed
    expect(r.must_haves).toEqual(["porch", "office"]);
    expect(r.optional_features).toEqual(["pool"]);
  });

  it("drops non-string array entries and caps arrays at eight", () => {
    const r = coerceParsedRequirements(
      { must_haves: ["a", 1, "b", null, "c", "d", "e", "f", "g", "h", "i"] },
      "brief",
    );
    expect(r.must_haves.every((x) => typeof x === "string")).toBe(true);
    expect(r.must_haves.length).toBeLessThanOrEqual(8);
  });

  it("uses the fallback must_haves when the payload list is empty", () => {
    const brief = "home with a covered porch";
    const fb = parseBriefFallback(brief);
    expect(fb.must_haves.length).toBeGreaterThan(0);
    const r = coerceParsedRequirements({ must_haves: [] }, brief);
    expect(r.must_haves).toEqual(fb.must_haves);
  });

  it("produces an object satisfying the ParsedRequirements shape", () => {
    const r: ParsedRequirements = coerceParsedRequirements({}, "brief text");
    expect(Object.keys(r).sort()).toEqual(
      [
        "baths",
        "beds",
        "code_jurisdiction_hint",
        "lot_size",
        "must_haves",
        "optional_features",
        "sqft",
        "story_count",
        "style",
      ].sort(),
    );
  });
});
