// Atelier v2.0 — brief adapter.
// Bridges the multi-step builder's `ParsedRequirements` (lib/builder.ts) into
// the kernel's richer `ParsedBrief` (lib/kernel/types.ts) so `generatePlan`
// can consume a real program. See docs/v2-spec.md §1.

import type { ParsedRequirements } from "@/lib/builder";
import type {
  AdjacencyRule,
  ParsedBrief,
  RoofType,
  RoomRequirement,
  RoomUse,
} from "./types";

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/* -------------------------------------------------------------------------- */
/* Roof inference                                                             */
/* -------------------------------------------------------------------------- */

// DECISION: the builder brief carries no explicit roof type, so we infer one
// from the architectural style keyword. Pitched-roof vernaculars (farmhouse,
// craftsman, cottage) map to gable; estate / villa styles to hip; flat-roofed
// modern idioms to flat; everything else falls back to a gable.
function inferRoof(style: string): RoofType {
  const s = style.toLowerCase();
  if (/modern|contemporary|courtyard|desert|urban|infill/.test(s)) {
    return "flat";
  }
  if (/villa|hillside|prairie|ranch|rambler/.test(s)) return "hip";
  if (/cabin|chalet|mountain|shed/.test(s)) return "shed";
  return "gable";
}

/* -------------------------------------------------------------------------- */
/* Lot orientation inference                                                  */
/* -------------------------------------------------------------------------- */

// DECISION: the brief has no compass data. We derive a deterministic
// orientation from the lot-size string so the same brief always orients the
// same way; a south-facing public band is the residential default, so we bias
// toward "S" and only rotate when the hash demands it.
function inferOrientation(req: ParsedRequirements): ParsedBrief["lotOrientation"] {
  const seed = `${req.lot_size}|${req.style}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const dirs: ParsedBrief["lotOrientation"][] = ["S", "S", "E", "W", "N"];
  return dirs[Math.abs(h) % dirs.length];
}

/* -------------------------------------------------------------------------- */
/* Room program derivation                                                    */
/* -------------------------------------------------------------------------- */

const FEATURE_RE = (req: ParsedRequirements, re: RegExp) =>
  [...req.must_haves, ...req.optional_features].some((f) => re.test(f));

/**
 * Derive concrete `RoomRequirement[]` from the builder brief.
 *
 * DECISION: the brief only gives bed/bath counts and a free-text feature list.
 * We translate those into the kernel's room program with min/max area bands
 * tuned so a typical brief packs near its `totalSqft`: public rooms scale with
 * total area, sleeping rooms hold steady IRC-comfortable bands, and optional
 * uses (office, porch) appear only when the feature list asks for them.
 */
function deriveRooms(req: ParsedRequirements): RoomRequirement[] {
  const beds = clamp(Math.round(req.beds), 1, 8);
  const baths = clamp(Math.round(req.baths), 1, 9);
  const sqft = clamp(req.sqft, 600, 12000);

  // Public-zone rooms scale gently with the overall footprint.
  const publicScale = clamp(sqft / 2400, 0.7, 2.4);

  const rooms: RoomRequirement[] = [
    {
      use: "foyer",
      count: 1,
      minSqft: 60,
      maxSqft: Math.round(110 * publicScale),
    },
    {
      use: "great-room",
      count: 1,
      minSqft: Math.round(280 * publicScale),
      maxSqft: Math.round(420 * publicScale),
    },
    {
      use: "kitchen",
      count: 1,
      minSqft: Math.round(170 * publicScale),
      maxSqft: Math.round(260 * publicScale),
    },
    {
      use: "dining",
      count: 1,
      minSqft: Math.round(130 * publicScale),
      maxSqft: Math.round(200 * publicScale),
    },
  ];

  // DECISION: the primary suite is split off as one bedroom-count slot; the
  // remaining bedrooms become standard `bedroom` rooms. Bands stay above the
  // IRC R304 70-sqft floor so generated sleeping rooms pass codeCheck.
  rooms.push({
    use: "primary-suite",
    count: 1,
    minSqft: 200,
    maxSqft: 320,
  });
  const secondaryBeds = Math.max(0, beds - 1);
  if (secondaryBeds > 0) {
    rooms.push({
      use: "bedroom",
      count: secondaryBeds,
      minSqft: 120,
      maxSqft: 180,
    });
  }

  rooms.push({
    use: "bathroom",
    count: baths,
    minSqft: 45,
    maxSqft: 100,
  });

  // Circulation + service: one hallway routes the private band; laundry,
  // mechanical and a mudroom keep the service zone realistic.
  rooms.push(
    { use: "hallway", count: 1, minSqft: 60, maxSqft: 130 },
    { use: "laundry", count: 1, minSqft: 45, maxSqft: 90 },
    { use: "mechanical", count: 1, minSqft: 35, maxSqft: 70 },
    { use: "mudroom", count: 1, minSqft: 45, maxSqft: 90 },
  );

  // Multi-story homes get a stair core.
  if (req.story_count > 1) {
    rooms.push({ use: "stair", count: 1, minSqft: 50, maxSqft: 90 });
  }

  // Optional, feature-driven uses.
  if (FEATURE_RE(req, /office|study|den/i)) {
    rooms.push({
      use: "office",
      count: 1,
      minSqft: 110,
      maxSqft: 170,
    });
  }
  if (FEATURE_RE(req, /porch|veranda|sunroom|screened/i)) {
    rooms.push({
      use: "porch",
      count: 1,
      minSqft: 120,
      maxSqft: 240,
    });
  }
  if (FEATURE_RE(req, /garage|car/i)) {
    rooms.push({
      use: "garage",
      count: 1,
      minSqft: 380,
      maxSqft: 600,
    });
  }

  return rooms;
}

/* -------------------------------------------------------------------------- */
/* Adjacency rules                                                            */
/* -------------------------------------------------------------------------- */

// DECISION: a fixed set of residential adjacency heuristics. Public living
// rooms cluster (open-concept), sleeping rooms separate from the noisy public
// zone, and service rooms tuck next to the spaces they support. `generatePlan`
// only honours rules whose uses are actually present, so listing all of them
// is safe regardless of the derived program.
function deriveAdjacencies(req: ParsedRequirements): AdjacencyRule[] {
  const rules: AdjacencyRule[] = [
    { a: "kitchen", b: "dining", relation: "adjacent" },
    { a: "kitchen", b: "great-room", relation: "adjacent" },
    { a: "dining", b: "great-room", relation: "adjacent" },
    { a: "foyer", b: "great-room", relation: "adjacent" },
    { a: "primary-suite", b: "bedroom", relation: "separated" },
    { a: "great-room", b: "primary-suite", relation: "separated" },
    { a: "great-room", b: "bedroom", relation: "separated" },
    { a: "hallway", b: "bedroom", relation: "adjacent" },
    { a: "hallway", b: "bathroom", relation: "adjacent" },
    { a: "laundry", b: "mudroom", relation: "adjacent" },
    { a: "kitchen", b: "mudroom", relation: "adjacent" },
    { a: "garage", b: "mudroom", relation: "adjacent" },
    { a: "garage", b: "bedroom", relation: "separated" },
  ];

  // Open-concept briefs reinforce the public cluster; quiet-office briefs pull
  // the office away from the great room.
  if (FEATURE_RE(req, /open[\s-]?(concept|plan|kitchen)/i)) {
    rules.push({ a: "kitchen", b: "foyer", relation: "adjacent" });
  }
  if (FEATURE_RE(req, /office|study|den/i)) {
    rules.push({ a: "office", b: "great-room", relation: "separated" });
  }

  return rules;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Adapt the builder's `ParsedRequirements` into the kernel's `ParsedBrief`.
 *
 * The kernel needs an explicit room program, adjacency rules, a roof type and
 * a lot orientation; the builder brief carries only bed/bath counts, a style
 * keyword, a square-foot target and a free-text feature list. Every derived
 * value is deterministic, so a given brief always yields the same `ParsedBrief`
 * (and therefore the same plan for a fixed seed).
 */
export function toParsedBrief(req: ParsedRequirements): ParsedBrief {
  const rooms = deriveRooms(req);
  // Filter adjacency rules down to uses actually in the program — keeps the
  // kernel input tidy even though `generatePlan` tolerates extras.
  const present = new Set<RoomUse>(rooms.map((r) => r.use));
  const adjacencies = deriveAdjacencies(req).filter(
    (rule) => present.has(rule.a) && present.has(rule.b),
  );

  return {
    totalSqft: clamp(req.sqft, 600, 12000),
    stories: clamp(Math.round(req.story_count), 1, 3),
    rooms,
    adjacencies,
    roof: inferRoof(req.style),
    lotOrientation: inferOrientation(req),
  };
}
