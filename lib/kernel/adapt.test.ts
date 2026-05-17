import { describe, expect, it } from "vitest";
import type { ParsedRequirements } from "@/lib/builder";
import { toParsedBrief } from "./adapt";
import type { RoomUse } from "./types";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

/** A neutral builder brief; individual tests override the fields they probe. */
function req(overrides: Partial<ParsedRequirements> = {}): ParsedRequirements {
  return {
    sqft: 2400,
    beds: 4,
    baths: 3,
    style: "transitional",
    story_count: 1,
    lot_size: "0.5 acres",
    must_haves: [],
    optional_features: [],
    code_jurisdiction_hint: "IRC 2021",
    ...overrides,
  };
}

/** Total room slots across every requirement (count is honoured downstream). */
const slotCount = (uses: { count: number }[]) =>
  uses.reduce((n, r) => n + r.count, 0);

const useOf = (uses: { use: RoomUse }[]) => new Set(uses.map((r) => r.use));

/* -------------------------------------------------------------------------- */
/* Determinism                                                                */
/* -------------------------------------------------------------------------- */

describe("toParsedBrief — determinism", () => {
  it("produces a deep-equal brief for identical input", () => {
    expect(toParsedBrief(req())).toEqual(toParsedBrief(req()));
  });
});

/* -------------------------------------------------------------------------- */
/* Scalar clamping                                                            */
/* -------------------------------------------------------------------------- */

describe("toParsedBrief — scalar clamping", () => {
  it("clamps totalSqft into the 600–12000 band", () => {
    expect(toParsedBrief(req({ sqft: 50 })).totalSqft).toBe(600);
    expect(toParsedBrief(req({ sqft: 99999 })).totalSqft).toBe(12000);
    expect(toParsedBrief(req({ sqft: 2400 })).totalSqft).toBe(2400);
  });

  it("clamps and rounds stories into the 1–3 band", () => {
    expect(toParsedBrief(req({ story_count: 0 })).stories).toBe(1);
    expect(toParsedBrief(req({ story_count: 9 })).stories).toBe(3);
    expect(toParsedBrief(req({ story_count: 2.4 })).stories).toBe(2);
  });
});

/* -------------------------------------------------------------------------- */
/* Roof inference                                                             */
/* -------------------------------------------------------------------------- */

describe("toParsedBrief — roof inference", () => {
  it("maps modern idioms to a flat roof", () => {
    for (const style of ["modern", "contemporary", "courtyard", "urban infill"]) {
      expect(toParsedBrief(req({ style })).roof).toBe("flat");
    }
  });

  it("maps estate / horizontal vernaculars to a hip roof", () => {
    for (const style of ["hillside villa", "prairie ranch", "rambler"]) {
      expect(toParsedBrief(req({ style })).roof).toBe("hip");
    }
  });

  it("maps mountain vernaculars to a shed roof", () => {
    for (const style of ["mountain cabin", "chalet"]) {
      expect(toParsedBrief(req({ style })).roof).toBe("shed");
    }
  });

  it("falls back to a gable roof for unrecognised styles", () => {
    expect(toParsedBrief(req({ style: "transitional" })).roof).toBe("gable");
    expect(toParsedBrief(req({ style: "" })).roof).toBe("gable");
  });
});

/* -------------------------------------------------------------------------- */
/* Lot orientation                                                            */
/* -------------------------------------------------------------------------- */

describe("toParsedBrief — lot orientation", () => {
  it("only ever emits a cardinal direction", () => {
    const dir = toParsedBrief(req()).lotOrientation;
    expect(["N", "S", "E", "W"]).toContain(dir);
  });

  it("is stable for the same lot-size + style pair", () => {
    const a = toParsedBrief(req({ lot_size: "1 acre", style: "lake home" }));
    const b = toParsedBrief(req({ lot_size: "1 acre", style: "lake home" }));
    expect(a.lotOrientation).toBe(b.lotOrientation);
  });
});

/* -------------------------------------------------------------------------- */
/* Room program derivation                                                    */
/* -------------------------------------------------------------------------- */

describe("toParsedBrief — room program", () => {
  it("always emits the public + service core", () => {
    const uses = useOf(toParsedBrief(req()).rooms);
    for (const u of [
      "foyer",
      "great-room",
      "kitchen",
      "dining",
      "primary-suite",
      "hallway",
      "laundry",
      "mechanical",
      "mudroom",
    ] as RoomUse[]) {
      expect(uses.has(u)).toBe(true);
    }
  });

  it("splits one primary suite off the bedroom count", () => {
    const rooms = toParsedBrief(req({ beds: 4 })).rooms;
    const primary = rooms.find((r) => r.use === "primary-suite");
    const bedrooms = rooms.find((r) => r.use === "bedroom");
    expect(primary?.count).toBe(1);
    expect(bedrooms?.count).toBe(3);
  });

  it("omits the secondary bedroom requirement for a one-bed brief", () => {
    const rooms = toParsedBrief(req({ beds: 1 })).rooms;
    expect(rooms.some((r) => r.use === "bedroom")).toBe(false);
    expect(rooms.some((r) => r.use === "primary-suite")).toBe(true);
  });

  it("clamps the bedroom and bathroom counts", () => {
    const rooms = toParsedBrief(req({ beds: 99, baths: 99 })).rooms;
    // beds clamps to 8 → 1 primary + 7 secondary bedrooms.
    expect(rooms.find((r) => r.use === "bedroom")?.count).toBe(7);
    expect(rooms.find((r) => r.use === "bathroom")?.count).toBe(9);
  });

  it("adds a stair core only for multi-story briefs", () => {
    expect(useOf(toParsedBrief(req({ story_count: 1 })).rooms).has("stair")).toBe(
      false,
    );
    expect(useOf(toParsedBrief(req({ story_count: 2 })).rooms).has("stair")).toBe(
      true,
    );
  });

  it("adds feature-driven rooms only when the feature list asks", () => {
    const bare = useOf(toParsedBrief(req()).rooms);
    expect(bare.has("office")).toBe(false);
    expect(bare.has("porch")).toBe(false);
    expect(bare.has("garage")).toBe(false);

    const rich = useOf(
      toParsedBrief(
        req({
          must_haves: ["home office", "screened porch"],
          optional_features: ["3-car garage"],
        }),
      ).rooms,
    );
    expect(rich.has("office")).toBe(true);
    expect(rich.has("porch")).toBe(true);
    expect(rich.has("garage")).toBe(true);
  });

  it("scales public-room area bands with the footprint", () => {
    const small = toParsedBrief(req({ sqft: 900 })).rooms;
    const large = toParsedBrief(req({ sqft: 8000 })).rooms;
    const great = (rs: typeof small) =>
      rs.find((r) => r.use === "great-room")!.maxSqft;
    expect(great(large)).toBeGreaterThan(great(small));
  });

  it("gives every requirement a positive, ordered area band", () => {
    for (const r of toParsedBrief(req({ story_count: 2 })).rooms) {
      expect(r.count).toBeGreaterThan(0);
      expect(r.minSqft).toBeGreaterThan(0);
      expect(r.maxSqft).toBeGreaterThanOrEqual(r.minSqft);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Adjacency rules                                                            */
/* -------------------------------------------------------------------------- */

describe("toParsedBrief — adjacency rules", () => {
  it("only references uses that exist in the derived program", () => {
    const brief = toParsedBrief(req());
    const present = useOf(brief.rooms);
    for (const rule of brief.adjacencies) {
      expect(present.has(rule.a)).toBe(true);
      expect(present.has(rule.b)).toBe(true);
    }
  });

  it("drops garage adjacency rules when no garage is present", () => {
    const brief = toParsedBrief(req());
    expect(brief.adjacencies.some((r) => r.a === "garage" || r.b === "garage")).toBe(
      false,
    );
  });

  it("keeps garage adjacency rules when a garage is requested", () => {
    const brief = toParsedBrief(req({ must_haves: ["2-car garage"] }));
    expect(brief.adjacencies.some((r) => r.a === "garage" || r.b === "garage")).toBe(
      true,
    );
  });

  it("adds an office separation rule for quiet-office briefs", () => {
    const brief = toParsedBrief(req({ must_haves: ["home office"] }));
    expect(
      brief.adjacencies.some(
        (r) => r.a === "office" && r.b === "great-room" && r.relation === "separated",
      ),
    ).toBe(true);
  });

  it("reinforces the public cluster for open-concept briefs", () => {
    const brief = toParsedBrief(req({ must_haves: ["open-concept living"] }));
    expect(
      brief.adjacencies.some((r) => r.a === "kitchen" && r.b === "foyer"),
    ).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Sanity                                                                     */
/* -------------------------------------------------------------------------- */

describe("toParsedBrief — sanity", () => {
  it("never emits zero rooms", () => {
    expect(slotCount(toParsedBrief(req({ beds: 1, baths: 1 })).rooms)).toBeGreaterThan(
      0,
    );
  });
});
