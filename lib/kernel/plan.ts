import type {
  AdjacencyRule,
  Opening,
  ParsedBrief,
  PlanGraph,
  Room,
  RoomUse,
  RoomZone,
  Vec2,
  Wall,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Deterministic PRNG                                                         */
/* -------------------------------------------------------------------------- */

// DECISION: a self-contained mulberry32 PRNG keeps the kernel dependency-free
// while guaranteeing identical output for a given seed (the spec forbids
// unseeded Math.random()). Every stochastic decision below draws from `rng`.
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/* Units & geometry helpers                                                   */
/* -------------------------------------------------------------------------- */

const MM_PER_FT = 304.8;
const SQMM_PER_SQFT = MM_PER_FT * MM_PER_FT;

const ftToMm = (ft: number) => ft * MM_PER_FT;
const sqftToSqmm = (sqft: number) => sqft * SQMM_PER_SQFT;

/** Axis-aligned rectangle in mm; the layout solver works purely in rects. */
type Rect = { x: number; y: number; w: number; h: number };

const round = (n: number) => Math.round(n);

function rectPolygon(r: Rect): Vec2[] {
  return [
    { x: round(r.x), y: round(r.y) },
    { x: round(r.x + r.w), y: round(r.y) },
    { x: round(r.x + r.w), y: round(r.y + r.h) },
    { x: round(r.x), y: round(r.y + r.h) },
  ];
}

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

/* -------------------------------------------------------------------------- */
/* Room classification                                                        */
/* -------------------------------------------------------------------------- */

const ZONE_BY_USE: Record<RoomUse, RoomZone> = {
  "great-room": "public",
  kitchen: "public",
  dining: "public",
  foyer: "public",
  office: "public",
  "primary-suite": "private",
  bedroom: "private",
  bathroom: "private",
  hallway: "private",
  laundry: "service",
  mechanical: "service",
  storage: "service",
  garage: "service",
  mudroom: "service",
  stair: "service",
  porch: "outdoor",
};

const LABEL_BY_USE: Record<RoomUse, string> = {
  "great-room": "Great Room",
  kitchen: "Kitchen",
  dining: "Dining",
  "primary-suite": "Primary Suite",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  laundry: "Laundry",
  mechanical: "Mechanical",
  storage: "Storage",
  garage: "Garage",
  office: "Office",
  mudroom: "Mudroom",
  hallway: "Hallway",
  foyer: "Foyer",
  porch: "Porch",
  stair: "Stair",
};

// DECISION: ceiling heights chosen to satisfy IRC minimums with margin —
// habitable spaces 9'-0", wet/service rooms 8'-0". codeCheck.ts validates
// these against CODE_RULES; keeping them generous keeps a clean plan clean.
const CEILING_HABITABLE_MM = ftToMm(9);
const CEILING_SERVICE_MM = ftToMm(8);

const WET_OR_SERVICE = new Set<RoomUse>([
  "bathroom",
  "laundry",
  "mechanical",
  "storage",
  "garage",
  "mudroom",
  "hallway",
  "stair",
]);

function ceilingFor(use: RoomUse): number {
  return WET_OR_SERVICE.has(use) ? CEILING_SERVICE_MM : CEILING_HABITABLE_MM;
}

function finishFor(use: RoomUse): string {
  switch (use) {
    case "bathroom":
    case "laundry":
    case "mudroom":
      return "tile";
    case "garage":
    case "mechanical":
    case "storage":
      return "concrete";
    case "kitchen":
    case "dining":
    case "great-room":
    case "foyer":
      return "engineered-oak";
    case "porch":
      return "composite-deck";
    default:
      return "carpet";
  }
}

/* -------------------------------------------------------------------------- */
/* Brief expansion                                                            */
/* -------------------------------------------------------------------------- */

/** A single concrete room slot to be placed (requirements have a `count`). */
type Slot = {
  use: RoomUse;
  zone: RoomZone;
  /** Target area in sqft, clamped to the requirement band. */
  targetSqft: number;
  index: number;
};

/**
 * Expand `RoomRequirement[]` into individual room slots, sizing each toward
 * the middle of its min/max band so the footprint lands near `totalSqft`.
 */
function expandSlots(brief: ParsedBrief, rng: () => number): Slot[] {
  const slots: Slot[] = [];
  for (const req of brief.rooms) {
    const count = Math.max(0, Math.floor(req.count));
    for (let i = 0; i < count; i++) {
      // Jitter within the band deterministically so repeated uses differ
      // slightly but stay reproducible for a fixed seed.
      const t = 0.4 + rng() * 0.35;
      const target = req.minSqft + (req.maxSqft - req.minSqft) * t;
      slots.push({
        use: req.use,
        zone: ZONE_BY_USE[req.use],
        targetSqft: Math.max(req.minSqft, target),
        index: i,
      });
    }
  }
  return slots;
}

/* -------------------------------------------------------------------------- */
/* Adjacency-aware ordering                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Order slots within a band so that `adjacent` rules place related uses next
 * to each other and `separated` rules push them apart. Deterministic: ties
 * resolved by the slot index, never by wall-clock or unseeded randomness.
 */
function orderByAdjacency(
  slots: Slot[],
  adjacencies: AdjacencyRule[],
): Slot[] {
  if (slots.length < 3) return slots.slice();

  const adjacentPairs = new Set<string>();
  const separatedPairs = new Set<string>();
  for (const rule of adjacencies) {
    const key = [rule.a, rule.b].sort().join("|");
    if (rule.relation === "adjacent") adjacentPairs.add(key);
    else separatedPairs.add(key);
  }
  const pairKey = (a: RoomUse, b: RoomUse) => [a, b].sort().join("|");

  // Greedy chain: start from the first slot, repeatedly append the unplaced
  // slot with the best affinity score to the current tail.
  const remaining = slots.slice();
  const ordered: Slot[] = [remaining.shift() as Slot];
  while (remaining.length > 0) {
    const tail = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const key = pairKey(tail.use, cand.use);
      let score = 0;
      if (adjacentPairs.has(key)) score += 10;
      if (separatedPairs.has(key)) score -= 10;
      if (cand.use === tail.use) score += 2; // group like rooms
      // Deterministic tie-break favouring original order.
      score -= cand.index * 0.01;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  return ordered;
}

/* -------------------------------------------------------------------------- */
/* Band packing                                                                */
/* -------------------------------------------------------------------------- */

/** A placed room rectangle plus the slot it came from. */
type Placed = { slot: Slot; rect: Rect };

/**
 * Pack a band of rooms left-to-right inside a horizontal strip of fixed
 * height. Each room's width derives from its target area / band height, with
 * a minimum so no room collapses below a usable dimension.
 */
function packBand(
  slots: Slot[],
  originX: number,
  originY: number,
  bandHeight: number,
): { placed: Placed[]; width: number } {
  const placed: Placed[] = [];
  let cursor = originX;
  const minDimMm = ftToMm(7); // honour the 7-ft minimum room dimension
  for (const slot of slots) {
    const areaMm = sqftToSqmm(slot.targetSqft);
    let w = areaMm / bandHeight;
    w = Math.max(w, minDimMm);
    const rect: Rect = { x: cursor, y: originY, w, h: bandHeight };
    placed.push({ slot, rect });
    cursor += w;
  }
  return { placed, width: cursor - originX };
}

/* -------------------------------------------------------------------------- */
/* Orientation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Transform a rectangle for the lot orientation. The solver builds the plan
 * facing south (public band on the +Y / south edge); other orientations
 * reflect or rotate the whole footprint so the public side faces the lot.
 */
function orientRect(r: Rect, orient: ParsedBrief["lotOrientation"], W: number, H: number): Rect {
  switch (orient) {
    case "S":
      return r;
    case "N":
      // 180° flip: public band moves to the opposite edge.
      return { x: W - r.x - r.w, y: H - r.y - r.h, w: r.w, h: r.h };
    case "E":
      // 90° CW: x/y swap, footprint dimensions transpose.
      return { x: H - r.y - r.h, y: r.x, w: r.h, h: r.w };
    case "W":
      // 90° CCW.
      return { x: r.y, y: W - r.x - r.w, w: r.h, h: r.w };
  }
}

/* -------------------------------------------------------------------------- */
/* Wall & opening synthesis                                                    */
/* -------------------------------------------------------------------------- */

const EXT_WALL_MM = 152; // 6" nominal exterior wall
const INT_WALL_MM = 114; // 4.5" nominal interior wall

/** Quantised edge key so shared room boundaries collapse to one wall. */
function edgeKey(a: Vec2, b: Vec2): string {
  const k = (v: Vec2) => `${Math.round(v.x)},${Math.round(v.y)}`;
  return [k(a), k(b)].sort().join("~");
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Generate a deterministic floor-plan graph from a parsed brief.
 *
 * Algorithm (constraint-based room packing, see docs/v2-spec.md §1.1):
 *  1. Expand requirements into concrete room slots, sized within their bands.
 *  2. Sort slots into public / private / service bands.
 *  3. Order each band by the adjacency rules (greedy affinity chain).
 *  4. Pack each band into a horizontal strip; stack the strips front-to-back.
 *  5. Reflect / rotate the whole footprint for `lotOrientation`.
 *  6. Derive walls from room edges (shared edges → interior, else exterior)
 *     and place a door per interior room plus egress windows on bedrooms.
 *
 * Everything stochastic flows through a seeded PRNG, so the output graph is
 * byte-identical for a given `(brief, seed)` pair.
 */
export function generatePlan(brief: ParsedBrief, seed = 1): PlanGraph {
  const rng = makeRng(seed);
  const slots = expandSlots(brief, rng);

  // --- 2. Split into the three interior bands -------------------------------
  const publicSlots = slots.filter((s) => s.zone === "public");
  const privateSlots = slots.filter((s) => s.zone === "private");
  const serviceSlots = slots.filter((s) => s.zone === "service");
  const outdoorSlots = slots.filter((s) => s.zone === "outdoor");

  // --- 3. Adjacency-aware ordering within each band -------------------------
  const publicOrdered = orderByAdjacency(publicSlots, brief.adjacencies);
  const privateOrdered = orderByAdjacency(privateSlots, brief.adjacencies);
  const serviceOrdered = orderByAdjacency(serviceSlots, brief.adjacencies);

  // --- 4. Choose band heights so the footprint is roughly rectangular -------
  // DECISION: band heights are derived from each band's total area divided by
  // a shared target width. We compute that width from the largest band so the
  // footprint stays close to a 1:1.4 aspect ratio (a pleasant home proportion)
  // rather than a long thin slab.
  const bandAreaSqft = (band: Slot[]) =>
    band.reduce((sum, s) => sum + s.targetSqft, 0);

  const publicArea = bandAreaSqft(publicOrdered);
  const privateArea = bandAreaSqft(privateOrdered);
  const serviceArea = bandAreaSqft(serviceOrdered);
  const interiorArea = Math.max(publicArea + privateArea + serviceArea, 1);

  // Target overall width: total area spread over a ~1.4 aspect ratio.
  const targetWidthMm = Math.sqrt(sqftToSqmm(interiorArea) * 1.4);

  const bandHeight = (area: number) =>
    area > 0 ? Math.max(sqftToSqmm(area) / targetWidthMm, ftToMm(8)) : 0;

  const serviceH = bandHeight(serviceArea); // front of the home
  const publicH = bandHeight(publicArea); // view side
  const privateH = bandHeight(privateArea); // back of the home

  // --- 5. Pack each band ----------------------------------------------------
  // Layout convention before orientation: front (service) at y=0, public in
  // the middle, private at the back. Public faces +Y once oriented "S".
  let y = 0;
  const servicePack = packBand(serviceOrdered, 0, y, serviceH || ftToMm(8));
  y += serviceH;
  const publicPack = packBand(publicOrdered, 0, y, publicH || ftToMm(8));
  y += publicH;
  const privatePack = packBand(privateOrdered, 0, y, privateH || ftToMm(8));
  y += privateH;

  const allPlaced = [
    ...servicePack.placed,
    ...publicPack.placed,
    ...privatePack.placed,
  ];

  // Footprint width = widest band; narrow bands are centred.
  const rawWidth = Math.max(
    servicePack.width,
    publicPack.width,
    privatePack.width,
    ftToMm(8),
  );
  const rawHeight = Math.max(y, ftToMm(8));

  // Centre each band horizontally within the footprint.
  const recenter = (placed: Placed[], bandWidth: number) => {
    const dx = (rawWidth - bandWidth) / 2;
    for (const p of placed) p.rect.x += dx;
  };
  recenter(servicePack.placed, servicePack.width);
  recenter(publicPack.placed, publicPack.width);
  recenter(privatePack.placed, privatePack.width);

  // Outdoor rooms (porches) attach to the public/view edge as a shallow strip.
  const outdoorPlaced: Placed[] = [];
  let footprintHeight = rawHeight;
  if (outdoorSlots.length > 0) {
    const porchDepth = ftToMm(8);
    let px = (rawWidth - publicPack.width) / 2;
    for (const slot of outdoorSlots) {
      const areaMm = sqftToSqmm(slot.targetSqft);
      const w = Math.max(areaMm / porchDepth, ftToMm(7));
      outdoorPlaced.push({
        slot,
        rect: { x: px, y: rawHeight, w, h: porchDepth },
      });
      px += w;
    }
    footprintHeight = rawHeight + porchDepth;
  }

  const everyPlaced = [...allPlaced, ...outdoorPlaced];

  // --- 6. Orient the footprint ----------------------------------------------
  const orient = brief.lotOrientation;
  const rotated = orient === "E" || orient === "W";
  const boundsW = round(rotated ? footprintHeight : rawWidth);
  const boundsH = round(rotated ? rawWidth : footprintHeight);

  // --- 7. Build rooms -------------------------------------------------------
  const rooms: Room[] = everyPlaced.map(({ slot, rect }) => {
    const oriented = orientRect(rect, orient, rawWidth, footprintHeight);
    const polygon = rectPolygon(oriented);
    const sameUse = brief.rooms.find((r) => r.use === slot.use);
    const count = sameUse ? sameUse.count : 1;
    const label =
      count > 1
        ? `${LABEL_BY_USE[slot.use]} ${slot.index + 1}`
        : LABEL_BY_USE[slot.use];
    return {
      id: `room-${slot.use}-${slot.index}`,
      label,
      use: slot.use,
      zone: slot.zone,
      polygon,
      areaSqft: Math.round(polygonAreaSqft(polygon) * 10) / 10,
      ceilingMm: ceilingFor(slot.use),
      finishFloor: finishFor(slot.use),
    };
  });

  // --- 8. Build walls from room edges ---------------------------------------
  // Each room contributes its 4 edges. Edges that appear once are exterior;
  // edges shared by two rooms are interior partitions.
  type EdgeRec = { a: Vec2; b: Vec2; count: number };
  const edges = new Map<string, EdgeRec>();
  for (const room of rooms) {
    if (room.zone === "outdoor") continue; // porches are open structures
    const poly = room.polygon;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const key = edgeKey(a, b);
      const existing = edges.get(key);
      if (existing) existing.count += 1;
      else edges.set(key, { a, b, count: 1 });
    }
  }

  const walls: Wall[] = [];
  let wallIdx = 0;
  for (const rec of edges.values()) {
    const shared = rec.count > 1;
    walls.push({
      id: `wall-${wallIdx++}`,
      kind: shared ? "interior" : "exterior",
      start: { x: rec.a.x, y: rec.a.y },
      end: { x: rec.b.x, y: rec.b.y },
      thicknessMm: shared ? INT_WALL_MM : EXT_WALL_MM,
    });
  }

  // --- 9. Place openings ----------------------------------------------------
  const openings: Opening[] = [];
  let openIdx = 0;

  const wallLength = (w: Wall) =>
    Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);

  // Index walls by quantised edge key for quick room→wall lookup.
  const wallByKey = new Map<string, Wall>();
  for (const w of walls) wallByKey.set(edgeKey(w.start, w.end), w);

  for (const room of rooms) {
    if (room.zone === "outdoor") continue;
    const poly = room.polygon;
    const roomWalls: Wall[] = [];
    for (let i = 0; i < poly.length; i++) {
      const w = wallByKey.get(edgeKey(poly[i], poly[(i + 1) % poly.length]));
      if (w) roomWalls.push(w);
    }
    const interiorWalls = roomWalls.filter((w) => w.kind === "interior");
    const exteriorWalls = roomWalls.filter((w) => w.kind === "exterior");

    // DECISION: every enclosed room needs a way in. We hang a door on its
    // first interior wall (a partition shared with a neighbour); if the room
    // has no interior wall — e.g. an isolated room — we fall back to an
    // exterior door so validatePlan never flags an unreachable space.
    const doorHost = interiorWalls[0] ?? exteriorWalls[0];
    if (doorHost) {
      const len = wallLength(doorHost);
      const doorW =
        room.use === "garage"
          ? Math.min(ftToMm(16), len * 0.8)
          : ftToMm(3); // 36" leaf clears the 32" code minimum
      openings.push({
        id: `opening-${openIdx++}`,
        kind: room.use === "garage" ? "garage-door" : "door",
        wallId: doorHost.id,
        offsetMm: Math.max(0, (len - doorW) / 2),
        widthMm: doorW,
        heightMm: room.use === "garage" ? ftToMm(8) : ftToMm(6.75),
        swing: rng() < 0.5 ? "left" : "right",
      });
    }

    // Egress / daylight windows on exterior walls. Bedrooms and the primary
    // suite always get at least one window large enough for IRC R310 egress.
    const needsEgress =
      room.use === "bedroom" || room.use === "primary-suite";
    const wantsWindow =
      needsEgress ||
      room.use === "great-room" ||
      room.use === "kitchen" ||
      room.use === "dining" ||
      room.use === "office";
    if (wantsWindow && exteriorWalls.length > 0) {
      // Pick the longest exterior wall for the main window.
      const host = exteriorWalls
        .slice()
        .sort((p, q) => wallLength(q) - wallLength(p))[0];
      const len = wallLength(host);
      // DECISION: a 4'-0" wide x 4'-0" tall window at a 24" sill yields
      // ~16 sqft of net clear opening — comfortably over IRC R310's 5.7 sqft
      // floor and under the 44" max sill — so generated bedrooms pass code.
      const winW = Math.min(ftToMm(4), Math.max(len - ftToMm(2), ftToMm(2)));
      const winH = ftToMm(4);
      openings.push({
        id: `opening-${openIdx++}`,
        kind: "window",
        wallId: host.id,
        offsetMm: Math.max(0, (len - winW) / 2),
        widthMm: winW,
        heightMm: winH,
        sillMm: ftToMm(2),
      });
    }
  }

  return {
    schemaVersion: 1,
    seed,
    level: brief.stories > 1 ? `Main level · 1 of ${brief.stories}` : "Main level",
    bounds: { width: boundsW, height: boundsH },
    rooms,
    walls,
    openings,
    roof: brief.roof,
  };
}
