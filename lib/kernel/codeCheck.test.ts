import { describe, expect, it } from "vitest";
import { CODE_RULES, validatePlan } from "./codeCheck";
import { generatePlan } from "./plan";
import type {
  Opening,
  ParsedBrief,
  PlanGraph,
  Room,
  RoomUse,
  Vec2,
  Wall,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Unit helpers (kernel works in mm; the IRC rules are imperial)              */
/* -------------------------------------------------------------------------- */

const MM_PER_FT = 304.8;
const MM_PER_IN = 25.4;
const ft = (n: number) => n * MM_PER_FT;
const inch = (n: number) => n * MM_PER_IN;

const SQMM_PER_SQFT = MM_PER_FT * MM_PER_FT;

/** Rectangular polygon at the origin, sized in feet. */
function rect(wFt: number, hFt: number): Vec2[] {
  return [
    { x: 0, y: 0 },
    { x: ft(wFt), y: 0 },
    { x: ft(wFt), y: ft(hFt) },
    { x: 0, y: ft(hFt) },
  ];
}

/** Build a wall list from a room polygon so `validatePlan` can link openings. */
function wallsForRoom(poly: Vec2[], kind: Wall["kind"] = "exterior"): Wall[] {
  const walls: Wall[] = [];
  for (let i = 0; i < poly.length; i++) {
    walls.push({
      id: `wall-${i}`,
      kind,
      start: poly[i],
      end: poly[(i + 1) % poly.length],
      thicknessMm: 152,
    });
  }
  return walls;
}

/** Compose a single-room graph for focused rule testing. */
function singleRoomGraph(room: Room, openings: Opening[] = []): PlanGraph {
  return {
    schemaVersion: 1,
    seed: 1,
    level: "Main level",
    bounds: { width: ft(40), height: ft(40) },
    rooms: [room],
    walls: wallsForRoom(room.polygon),
    openings,
    roof: "gable",
  };
}

function makeRoom(use: RoomUse, poly: Vec2[], ceilingMm = ft(9)): Room {
  let a2 = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a2 += p.x * q.y - q.x * p.y;
  }
  return {
    id: `room-${use}`,
    label: use,
    use,
    zone: "private",
    polygon: poly,
    areaSqft: Math.abs(a2) / 2 / SQMM_PER_SQFT,
    ceilingMm,
    finishFloor: "carpet",
  };
}

/** A comfortably code-compliant egress window: ~13 sqft net clear, 24" sill. */
function compliantWindow(wallId = "wall-0"): Opening {
  return {
    id: "win-ok",
    kind: "window",
    wallId,
    offsetMm: ft(1),
    widthMm: ft(4),
    heightMm: ft(4),
    sillMm: ft(2),
  };
}

/* -------------------------------------------------------------------------- */
/* Clean plan                                                                */
/* -------------------------------------------------------------------------- */

describe("validatePlan — compliant plans", () => {
  it("returns no violations for a generated plan", () => {
    const brief: ParsedBrief = {
      totalSqft: 1800,
      stories: 1,
      rooms: [
        { use: "great-room", count: 1, minSqft: 300, maxSqft: 400 },
        { use: "kitchen", count: 1, minSqft: 180, maxSqft: 240 },
        { use: "primary-suite", count: 1, minSqft: 240, maxSqft: 320 },
        { use: "bedroom", count: 2, minSqft: 120, maxSqft: 170 },
        { use: "bathroom", count: 2, minSqft: 60, maxSqft: 90 },
      ],
      adjacencies: [],
      roof: "hip",
      lotOrientation: "S",
    };
    // The kernel deliberately sizes rooms and windows to clear the IRC.
    expect(validatePlan(generatePlan(brief, 11))).toEqual([]);
  });

  it("passes a hand-built compliant bedroom", () => {
    const room = makeRoom("bedroom", rect(11, 12));
    expect(validatePlan(singleRoomGraph(room, [compliantWindow()]))).toEqual(
      [],
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Bedroom rules                                                              */
/* -------------------------------------------------------------------------- */

describe("validatePlan — bedroom-min-area", () => {
  it("flags an undersized bedroom", () => {
    // 7 x 9 ft = 63 sqft < the 70 sqft IRC R304.1 minimum.
    const room = makeRoom("bedroom", rect(7, 9));
    const found = validatePlan(singleRoomGraph(room, [compliantWindow()]));
    const v = found.find((x) => x.ruleId === "bedroom-min-area");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("error");
    expect(v?.objectId).toBe(room.id);
  });

  it("accepts a bedroom comfortably over the 70 sqft threshold", () => {
    const room = makeRoom("bedroom", rect(8, 10)); // 80 sqft
    const found = validatePlan(singleRoomGraph(room, [compliantWindow()]));
    expect(found.some((x) => x.ruleId === "bedroom-min-area")).toBe(false);
  });
});

describe("validatePlan — bedroom-min-dim", () => {
  it("flags a bedroom narrower than 7 ft on its short side", () => {
    // 6 x 14 ft = 84 sqft (area OK) but only 6 ft across.
    const room = makeRoom("bedroom", rect(6, 14));
    const found = validatePlan(singleRoomGraph(room, [compliantWindow()]));
    const v = found.find((x) => x.ruleId === "bedroom-min-dim");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("error");
  });
});

describe("validatePlan — bedroom-egress", () => {
  it("flags a bedroom with no window at all", () => {
    const room = makeRoom("bedroom", rect(11, 12));
    const found = validatePlan(singleRoomGraph(room, []));
    const v = found.find((x) => x.ruleId === "bedroom-egress");
    expect(v).toBeDefined();
    expect(v?.objectId).toBe(room.id);
    expect(v?.message).toContain("egress");
  });

  it("flags a bedroom whose window is too small for R310 net clear", () => {
    const room = makeRoom("bedroom", rect(11, 12));
    // 2 x 2 ft window → ~3.2 sqft net clear, below the 5.7 sqft minimum.
    const tinyWindow: Opening = {
      id: "win-tiny",
      kind: "window",
      wallId: "wall-0",
      offsetMm: ft(1),
      widthMm: ft(2),
      heightMm: ft(2),
      sillMm: ft(2),
    };
    const found = validatePlan(singleRoomGraph(room, [tinyWindow]));
    const v = found.find((x) => x.ruleId === "bedroom-egress");
    expect(v).toBeDefined();
    expect(v?.objectId).toBe("win-tiny");
    expect(v?.message).toContain("net clear");
  });

  it("flags a bedroom whose egress window sill is above 44 in", () => {
    const room = makeRoom("bedroom", rect(11, 12));
    const highSill: Opening = {
      id: "win-high",
      kind: "window",
      wallId: "wall-0",
      offsetMm: ft(1),
      widthMm: ft(4),
      heightMm: ft(4),
      sillMm: inch(54), // above the 44 in max
    };
    const found = validatePlan(singleRoomGraph(room, [highSill]));
    const v = found.find((x) => x.ruleId === "bedroom-egress");
    expect(v).toBeDefined();
    expect(v?.message).toContain("sill");
  });

  it("does not require an egress window for non-sleeping rooms", () => {
    const office = makeRoom("office", rect(10, 10));
    const found = validatePlan(singleRoomGraph(office, []));
    expect(found.some((x) => x.ruleId === "bedroom-egress")).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Hallway, ceiling and door rules                                            */
/* -------------------------------------------------------------------------- */

describe("validatePlan — hallway-min-width", () => {
  it("flags a hallway narrower than 36 in clear", () => {
    // 2.5 ft = 30 in wide, below the 36 in IRC R311.6 minimum.
    const hall = makeRoom("hallway", rect(2.5, 20));
    hall.zone = "private";
    const found = validatePlan(singleRoomGraph(hall));
    const v = found.find((x) => x.ruleId === "hallway-min-width");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("error");
  });

  it("accepts a 36 in hallway", () => {
    const hall = makeRoom("hallway", rect(3, 20), ft(8));
    const found = validatePlan(singleRoomGraph(hall));
    expect(found.some((x) => x.ruleId === "hallway-min-width")).toBe(false);
  });
});

describe("validatePlan — ceiling-min-height", () => {
  it("flags a habitable room with a sub-7 ft ceiling", () => {
    const room = makeRoom("great-room", rect(14, 16), inch(78)); // 6'-6"
    room.zone = "public";
    const found = validatePlan(singleRoomGraph(room));
    const v = found.find((x) => x.ruleId === "ceiling-min-height");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("error");
  });

  it("allows a bathroom down to the 6 ft 8 in bath minimum", () => {
    // 80 in ceiling — too low for habitable, but legal for a bathroom.
    const bath = makeRoom("bathroom", rect(8, 8), inch(80));
    bath.zone = "private";
    const found = validatePlan(singleRoomGraph(bath));
    expect(found.some((x) => x.ruleId === "ceiling-min-height")).toBe(false);
  });
});

describe("validatePlan — door-clear-width", () => {
  it("flags an undersized exterior door as an error", () => {
    const room = makeRoom("bedroom", rect(11, 12));
    const narrowDoor: Opening = {
      id: "door-ext",
      kind: "door",
      wallId: "wall-0", // exterior wall in singleRoomGraph
      offsetMm: ft(1),
      widthMm: inch(28), // below the 32 in clear minimum
      heightMm: ft(6.75),
    };
    const found = validatePlan(
      singleRoomGraph(room, [compliantWindow("wall-1"), narrowDoor]),
    );
    const v = found.find((x) => x.ruleId === "door-clear-width");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("error");
  });

  it("flags an undersized interior door only as a warning", () => {
    const room = makeRoom("bedroom", rect(11, 12));
    const graph = singleRoomGraph(room, [compliantWindow("wall-1")]);
    // Mark the door's host wall interior, then add the narrow door.
    graph.walls[0] = { ...graph.walls[0], kind: "interior" };
    graph.openings = [
      ...graph.openings,
      {
        id: "door-int",
        kind: "door",
        wallId: "wall-0",
        offsetMm: ft(1),
        widthMm: inch(28),
        heightMm: ft(6.75),
      },
    ];
    const v = validatePlan(graph).find((x) => x.ruleId === "door-clear-width");
    expect(v).toBeDefined();
    expect(v?.severity).toBe("warning");
  });

  it("ignores garage-door openings for the 32 in clear rule", () => {
    const garage = makeRoom("garage", rect(20, 20), ft(8));
    garage.zone = "service";
    const garageDoor: Opening = {
      id: "gd",
      kind: "garage-door",
      wallId: "wall-0",
      offsetMm: ft(2),
      widthMm: ft(16),
      heightMm: ft(8),
    };
    const found = validatePlan(singleRoomGraph(garage, [garageDoor]));
    expect(found.some((x) => x.ruleId === "door-clear-width")).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Aggregate behaviour                                                        */
/* -------------------------------------------------------------------------- */

describe("validatePlan — aggregate behaviour", () => {
  it("reports multiple violations for one badly-built bedroom", () => {
    // 6 x 10 ft = 60 sqft: undersized area AND under-7-ft short side, plus
    // no egress window.
    const room = makeRoom("bedroom", rect(6, 10));
    const ruleIds = validatePlan(singleRoomGraph(room, [])).map(
      (v) => v.ruleId,
    );
    expect(ruleIds).toContain("bedroom-min-area");
    expect(ruleIds).toContain("bedroom-min-dim");
    expect(ruleIds).toContain("bedroom-egress");
  });

  it("returns violations in a stable, sorted order", () => {
    const room = makeRoom("bedroom", rect(6, 10));
    const found = validatePlan(singleRoomGraph(room, []));
    const sorted = [...found].sort(
      (a, b) =>
        a.ruleId.localeCompare(b.ruleId) ||
        a.objectId.localeCompare(b.objectId),
    );
    expect(found).toEqual(sorted);
  });

  it("exposes the documented IRC thresholds", () => {
    expect(CODE_RULES.bedroomMinSqft).toBe(70);
    expect(CODE_RULES.egressNetClearSqft).toBe(5.7);
    expect(CODE_RULES.doorClearMinIn).toBe(32);
  });
});
