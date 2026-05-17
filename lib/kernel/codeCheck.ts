import type { Opening, PlanGraph, Room, Vec2, Wall } from "./types";

export type CodeViolation = {
  ruleId: string;
  severity: "error" | "warning";
  /** Id of the offending room / wall / opening. */
  objectId: string;
  message: string;
  suggestion: string;
};

/** IRC residential-code thresholds. See docs/v2-spec.md §1.3. */
export const CODE_RULES = {
  egressNetClearSqft: 5.7, // IRC R310
  egressSillMaxIn: 44,
  hallwayMinIn: 36,
  doorClearMinIn: 32,
  stairRiserMinIn: 4,
  stairRiserMaxIn: 7.75,
  stairTreadMinIn: 10,
  stairHeadroomMinIn: 80,
  bedroomMinSqft: 70,
  bedroomMinDimFt: 7,
  ceilingHabitableMinIn: 84,
  ceilingBathMinIn: 80,
} as const;

/* -------------------------------------------------------------------------- */
/* Unit helpers                                                               */
/* -------------------------------------------------------------------------- */

const MM_PER_IN = 25.4;
const MM_PER_FT = 304.8;
const SQMM_PER_SQFT = MM_PER_FT * MM_PER_FT;

const mmToIn = (mm: number) => mm / MM_PER_IN;
const mmToFt = (mm: number) => mm / MM_PER_FT;

/** Round a value for human-readable messages. */
const r1 = (n: number) => Math.round(n * 10) / 10;

/* -------------------------------------------------------------------------- */
/* Geometry helpers                                                           */
/* -------------------------------------------------------------------------- */

/** Shoelace area of a closed polygon ring, in square feet. */
function polygonAreaSqft(poly: Vec2[]): number {
  let a2 = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a2 += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a2) / 2 / SQMM_PER_SQFT;
}

/**
 * Axis-aligned bounding box of a polygon, in mm. The kernel emits rectangular
 * rooms, so the bbox width/height equal the room's real dimensions.
 */
function bbox(poly: Vec2[]): { width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { width: maxX - minX, height: maxY - minY };
}

/** Quantised edge key matching `plan.ts`, so rooms can be linked to walls. */
function edgeKey(a: Vec2, b: Vec2): string {
  const k = (v: Vec2) => `${Math.round(v.x)},${Math.round(v.y)}`;
  return [k(a), k(b)].sort().join("~");
}

/* -------------------------------------------------------------------------- */
/* Per-rule checks                                                            */
/* -------------------------------------------------------------------------- */

const BEDROOM_USES = new Set<Room["use"]>(["bedroom", "primary-suite"]);

// DECISION: the IRC requires natural light/ventilation for all habitable
// rooms, but the spec's §1.3 rule list scopes the egress-window check to
// bedrooms (sleeping rooms — IRC R310). We honour that scope exactly and only
// flag a missing egress opening for bedrooms / the primary suite.
const HABITABLE_USES = new Set<Room["use"]>([
  "great-room",
  "kitchen",
  "dining",
  "primary-suite",
  "bedroom",
  "office",
]);

/** IRC R310 net-clear opening of a window, in square feet. */
function egressNetClearSqft(opening: Opening): number {
  // DECISION: a casement/double-hung window's net clear opening is smaller
  // than its rough frame. We model the operable clear area as 90% of the unit
  // dimensions — a conservative, deterministic factor that avoids passing a
  // window that is in reality too small once frame and sash are deducted.
  const clearW = mmToFt(opening.widthMm) * 0.9;
  const clearH = mmToFt(opening.heightMm) * 0.9;
  return clearW * clearH;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Validate a plan against the IRC rule set (see docs/v2-spec.md §1.3).
 *
 * Implemented rules:
 *  - `bedroom-min-area`     — sleeping rooms ≥ 70 sqft (IRC R304).
 *  - `bedroom-min-dim`      — sleeping rooms ≥ 7'-0" in every direction.
 *  - `bedroom-egress`       — every bedroom has an egress window meeting
 *                             IRC R310 net-clear area and max sill height.
 *  - `hallway-min-width`    — hallways ≥ 36" clear (IRC R311.6).
 *  - `door-clear-width`     — door leaves ≥ 32" clear (IRC R311.2).
 *  - `ceiling-min-height`   — habitable ≥ 7'-0", bath ≥ 6'-8" (IRC R305).
 *
 * Results are deterministic and ordered by rule then object id so callers
 * (the "Code check" panel) get a stable list.
 */
export function validatePlan(graph: PlanGraph): CodeViolation[] {
  const violations: CodeViolation[] = [];

  const openingsByWall = new Map<string, Opening[]>();
  for (const op of graph.openings) {
    const list = openingsByWall.get(op.wallId);
    if (list) list.push(op);
    else openingsByWall.set(op.wallId, [op]);
  }

  const wallById = new Map<string, Wall>();
  for (const w of graph.walls) wallById.set(w.id, w);

  // Index walls by quantised edge key so each room can find its own walls.
  const wallByKey = new Map<string, Wall>();
  for (const w of graph.walls) wallByKey.set(edgeKey(w.start, w.end), w);

  /** Collect the openings hosted on the perimeter walls of a room. */
  function openingsForRoom(room: Room): Opening[] {
    const poly = room.polygon;
    const out: Opening[] = [];
    for (let i = 0; i < poly.length; i++) {
      const w = wallByKey.get(edgeKey(poly[i], poly[(i + 1) % poly.length]));
      if (!w) continue;
      const ops = openingsByWall.get(w.id);
      if (ops) out.push(...ops);
    }
    return out;
  }

  /* --- Room-scoped rules --------------------------------------------------- */
  for (const room of graph.rooms) {
    const isBedroom = BEDROOM_USES.has(room.use);
    const { width, height } = bbox(room.polygon);

    if (isBedroom) {
      // bedroom-min-area — IRC R304.1
      const area = room.areaSqft || polygonAreaSqft(room.polygon);
      if (area < CODE_RULES.bedroomMinSqft) {
        violations.push({
          ruleId: "bedroom-min-area",
          severity: "error",
          objectId: room.id,
          message: `${room.label} is ${r1(area)} sqft; sleeping rooms must be at least ${CODE_RULES.bedroomMinSqft} sqft (IRC R304.1).`,
          suggestion: `Enlarge the room by ${r1(CODE_RULES.bedroomMinSqft - area)} sqft.`,
        });
      }

      // bedroom-min-dim — IRC R304.2: no habitable dimension under 7'-0".
      const minDimMm = CODE_RULES.bedroomMinDimFt * MM_PER_FT;
      const shortMm = Math.min(width, height);
      if (shortMm + 0.5 < minDimMm) {
        violations.push({
          ruleId: "bedroom-min-dim",
          severity: "error",
          objectId: room.id,
          message: `${room.label} is only ${r1(mmToFt(shortMm))} ft across; sleeping rooms need at least ${CODE_RULES.bedroomMinDimFt} ft in every direction (IRC R304.2).`,
          suggestion: `Widen the short side to at least ${CODE_RULES.bedroomMinDimFt} ft.`,
        });
      }

      // bedroom-egress — IRC R310: at least one compliant egress window.
      const windows = openingsForRoom(room).filter((o) => o.kind === "window");
      const compliant = windows.filter((win) => {
        const netSqft = egressNetClearSqft(win);
        const sillIn = win.sillMm !== undefined ? mmToIn(win.sillMm) : 0;
        return (
          netSqft + 1e-6 >= CODE_RULES.egressNetClearSqft &&
          sillIn <= CODE_RULES.egressSillMaxIn + 1e-6
        );
      });
      if (windows.length === 0) {
        violations.push({
          ruleId: "bedroom-egress",
          severity: "error",
          objectId: room.id,
          message: `${room.label} has no egress window; every sleeping room needs an emergency escape opening (IRC R310).`,
          suggestion: `Add an operable window on an exterior wall with at least ${CODE_RULES.egressNetClearSqft} sqft net clear opening.`,
        });
      } else if (compliant.length === 0) {
        // A window exists but none of the windows meet R310 — flag the largest
        // so the panel can highlight the closest candidate to fix.
        const worst = windows
          .slice()
          .sort((a, b) => egressNetClearSqft(b) - egressNetClearSqft(a))[0];
        const netSqft = egressNetClearSqft(worst);
        const sillIn = worst.sillMm !== undefined ? mmToIn(worst.sillMm) : 0;
        const reasons: string[] = [];
        if (netSqft + 1e-6 < CODE_RULES.egressNetClearSqft) {
          reasons.push(
            `net clear opening is ${r1(netSqft)} sqft (needs ${CODE_RULES.egressNetClearSqft} sqft)`,
          );
        }
        if (sillIn > CODE_RULES.egressSillMaxIn + 1e-6) {
          reasons.push(
            `sill is ${r1(sillIn)} in above the floor (max ${CODE_RULES.egressSillMaxIn} in)`,
          );
        }
        violations.push({
          ruleId: "bedroom-egress",
          severity: "error",
          objectId: worst.id,
          message: `${room.label}'s egress window fails IRC R310: ${reasons.join(" and ")}.`,
          suggestion: `Enlarge the window or lower the sill so it provides at least ${CODE_RULES.egressNetClearSqft} sqft of clear opening below a ${CODE_RULES.egressSillMaxIn}-in sill.`,
        });
      }
    }

    // hallway-min-width — IRC R311.6: hallways at least 36" clear.
    if (room.use === "hallway") {
      const minClearMm = CODE_RULES.hallwayMinIn * MM_PER_IN;
      const shortMm = Math.min(width, height);
      if (shortMm + 0.5 < minClearMm) {
        violations.push({
          ruleId: "hallway-min-width",
          severity: "error",
          objectId: room.id,
          message: `${room.label} is ${r1(mmToIn(shortMm))} in wide; hallways must be at least ${CODE_RULES.hallwayMinIn} in clear (IRC R311.6).`,
          suggestion: `Widen the hallway to at least ${CODE_RULES.hallwayMinIn} in.`,
        });
      }
    }

    // ceiling-min-height — IRC R305: habitable 7'-0", bath/laundry 6'-8".
    const ceilingIn = mmToIn(room.ceilingMm);
    if (HABITABLE_USES.has(room.use)) {
      if (ceilingIn + 1e-6 < CODE_RULES.ceilingHabitableMinIn) {
        violations.push({
          ruleId: "ceiling-min-height",
          severity: "error",
          objectId: room.id,
          message: `${room.label} has a ${r1(ceilingIn)}-in ceiling; habitable rooms require at least ${CODE_RULES.ceilingHabitableMinIn} in (IRC R305.1).`,
          suggestion: `Raise the ceiling to at least ${CODE_RULES.ceilingHabitableMinIn} in (7'-0").`,
        });
      }
    } else if (room.use === "bathroom" || room.use === "laundry") {
      // DECISION: IRC R305.1 lets bathrooms, toilet rooms and laundry rooms
      // drop to a 6'-8" ceiling, so these uses are checked against the lower
      // `ceilingBathMinIn` threshold rather than the habitable minimum.
      if (ceilingIn + 1e-6 < CODE_RULES.ceilingBathMinIn) {
        violations.push({
          ruleId: "ceiling-min-height",
          severity: "error",
          objectId: room.id,
          message: `${room.label} has a ${r1(ceilingIn)}-in ceiling; bath and laundry rooms require at least ${CODE_RULES.ceilingBathMinIn} in (IRC R305.1).`,
          suggestion: `Raise the ceiling to at least ${CODE_RULES.ceilingBathMinIn} in (6'-8").`,
        });
      }
    }
  }

  /* --- Opening-scoped rules ------------------------------------------------ */
  for (const opening of graph.openings) {
    // door-clear-width — IRC R311.2: at least one 32"-clear egress door.
    // DECISION: garage doors are vehicular openings, not pedestrian egress
    // doors, so the 32"-clear rule does not apply to them and they are
    // skipped here.
    if (opening.kind !== "door") continue;
    const clearIn = mmToIn(opening.widthMm);
    if (clearIn + 1e-6 < CODE_RULES.doorClearMinIn) {
      const host = wallById.get(opening.wallId);
      const onExterior = host?.kind === "exterior";
      violations.push({
        ruleId: "door-clear-width",
        // DECISION: an undersized exterior door blocks code-required egress
        // (error); an undersized interior door is a usability issue the IRC
        // does not mandate everywhere, so it is reported as a warning.
        severity: onExterior ? "error" : "warning",
        objectId: opening.id,
        message: `Door is ${r1(clearIn)} in wide; ${onExterior ? "the required egress door" : "doors"} should provide at least ${CODE_RULES.doorClearMinIn} in clear (IRC R311.2).`,
        suggestion: `Widen the door to at least ${CODE_RULES.doorClearMinIn} in clear (a 36-in leaf is typical).`,
      });
    }
  }

  // Stable, deterministic ordering for the UI panel.
  violations.sort(
    (a, b) =>
      a.ruleId.localeCompare(b.ruleId) || a.objectId.localeCompare(b.objectId),
  );
  return violations;
}
