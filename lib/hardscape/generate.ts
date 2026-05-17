// Atelier — hardscape design kernel: deterministic site-layout generator.
//
// `generateHardscape` turns a `HardscapeBrief` into a `HardscapePlan`: each
// requested element becomes a parametric polygon laid out in a millimeter
// site grid, with a shoelace-computed area. Mirrors the structural style of
// `lib/kernel/plan.ts` — seeded PRNG, mm units, closed polygon rings.

import type {
  HardscapeBrief,
  HardscapeDecor,
  HardscapeElement,
  HardscapeElementKind,
  HardscapeElementRequest,
  HardscapeMaterial,
  HardscapePlan,
  Vec2,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Deterministic PRNG                                                         */
/* -------------------------------------------------------------------------- */

// DECISION: a self-contained mulberry32 PRNG — identical to the home kernel's —
// keeps the hardscape kernel dependency-free while guaranteeing identical
// output for a given seed (the spec forbids unseeded Math.random()). Every
// stochastic decision below draws from `rng`.
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

const round = (n: number) => Math.round(n);

/** Axis-aligned rectangle in mm; the layout solver works purely in rects. */
type Rect = { x: number; y: number; w: number; h: number };

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

const roundArea = (sqft: number) => Math.round(sqft * 10) / 10;

/* -------------------------------------------------------------------------- */
/* Per-kind parametric defaults                                               */
/* -------------------------------------------------------------------------- */

/**
 * Sensible default geometry per element kind. `defaultSqft` sizes the element
 * when the brief omits a target; `aspect` (width / depth) keeps the parametric
 * rectangle in a realistic proportion as it scales toward the target area.
 */
const KIND_DEFAULTS: Record<
  HardscapeElementKind,
  { defaultSqft: number; aspect: number; minDimFt: number }
> = {
  // A two-car driveway: long and fairly wide.
  driveway: { defaultSqft: 600, aspect: 0.45, minDimFt: 9 },
  // A walkway: a narrow ribbon — far wider than it is deep.
  walkway: { defaultSqft: 120, aspect: 8, minDimFt: 3 },
  // A patio: a roughly square outdoor room.
  patio: { defaultSqft: 320, aspect: 1.25, minDimFt: 8 },
  // A pool deck: a broad apron, wider than deep.
  "pool-deck": { defaultSqft: 480, aspect: 1.6, minDimFt: 10 },
  // A run of steps: wide and shallow.
  steps: { defaultSqft: 48, aspect: 4, minDimFt: 2 },
  // A decorative border: a thin ribbon element.
  border: { defaultSqft: 60, aspect: 10, minDimFt: 1 },
};

const LABEL_BY_KIND: Record<HardscapeElementKind, string> = {
  driveway: "Driveway",
  walkway: "Walkway",
  patio: "Patio",
  "pool-deck": "Pool Deck",
  steps: "Steps",
  border: "Border",
};

/**
 * Derive an axis-aligned rect for an element from its target area and the
 * per-kind aspect ratio. `w = sqrt(area * aspect)`, `h = area / w`, then each
 * dimension is clamped to the kind's minimum so nothing collapses.
 */
function rectForKind(kind: HardscapeElementKind, targetSqft: number): Rect {
  const def = KIND_DEFAULTS[kind];
  const areaMm = sqftToSqmm(Math.max(targetSqft, 1));
  const minDim = ftToMm(def.minDimFt);
  let w = Math.sqrt(areaMm * def.aspect);
  let h = areaMm / w;
  w = Math.max(w, minDim);
  h = Math.max(h, minDim);
  return { x: 0, y: 0, w, h };
}

/* -------------------------------------------------------------------------- */
/* Decorative geometry                                                        */
/* -------------------------------------------------------------------------- */

const BORDER_BAND_FT = 1; // 12" decorative band ribbon
const MEDALLION_FT = 4; // 4'-0" square medallion inlay

/** Element kinds eligible for a banded border (broad slab surfaces). */
const BORDER_ELIGIBLE = new Set<HardscapeElementKind>(["patio", "pool-deck"]);

/**
 * Build the four-sided banded border ribbon as a single annular element.
 * Modelled as the outer ring traced clockwise — area is computed as the
 * difference between outer and inner rects so the shoelace stays correct.
 */
function bandedBorderElement(
  host: Rect,
  material: HardscapeMaterial,
  id: string,
): HardscapeElement {
  const band = ftToMm(BORDER_BAND_FT);
  // The band hugs the host's outer edge; its "polygon" is the host outline,
  // and its area is the host area minus the inset core (a true frame).
  const outer = rectPolygon(host);
  const outerSqft = polygonAreaSqft(outer);
  const innerSqft = polygonAreaSqft(
    rectPolygon({
      x: host.x + band,
      y: host.y + band,
      w: Math.max(host.w - band * 2, 1),
      h: Math.max(host.h - band * 2, 1),
    }),
  );
  return {
    id,
    kind: "border",
    material,
    polygon: outer,
    areaSqft: roundArea(Math.max(outerSqft - innerSqft, 0)),
    label: "Banded Border",
  };
}

/** Build a square medallion inlay centred on its host element. */
function medallionElement(
  host: Rect,
  material: HardscapeMaterial,
  id: string,
): HardscapeElement {
  const size = Math.min(ftToMm(MEDALLION_FT), host.w * 0.5, host.h * 0.5);
  const rect: Rect = {
    x: host.x + (host.w - size) / 2,
    y: host.y + (host.h - size) / 2,
    w: size,
    h: size,
  };
  const polygon = rectPolygon(rect);
  return {
    id,
    kind: "border",
    material,
    polygon,
    areaSqft: roundArea(polygonAreaSqft(polygon)),
    label: "Medallion Inlay",
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Generate a deterministic hardscape site layout from a brief.
 *
 * Algorithm (parametric stacked layout):
 *  1. For each requested element, derive a parametric rectangle from its
 *     target area (or a per-kind default) and the kind's aspect ratio.
 *  2. Stack the elements top-to-bottom in a single column, centred on a
 *     shared site centre-line, with a small deterministic gap between rows.
 *  3. Layer decorative options: a banded border frames the largest eligible
 *     slab, a medallion inlay drops onto the largest patio.
 *  4. Compute each element's shoelace area, the plan total, and site bounds.
 *
 * Everything stochastic flows through a seeded PRNG, so the output plan is
 * byte-identical for a given `(brief, seed)` pair.
 *
 * // TODO(v2): true parcel-aware siting — placing the driveway against the
 * // street, the walkway from drive to entry, patios off the rear of the
 * // house — needs the parcel/house geometry the home kernel produces. This
 * // core kernel only delivers a clean stand-alone parametric layout.
 */
export function generateHardscape(
  brief: HardscapeBrief,
  seed = 1,
): HardscapePlan {
  const rng = makeRng(seed);

  // --- 1. Parametric rect per requested element -----------------------------
  type Sized = {
    request: HardscapeElementRequest;
    rect: Rect;
    index: number;
  };
  const sized: Sized[] = brief.elements.map((request, index) => {
    const target =
      request.targetSqft ?? KIND_DEFAULTS[request.kind].defaultSqft;
    return { request, rect: rectForKind(request.kind, target), index };
  });

  // --- 2. Stack the elements in a centred column ----------------------------
  // A small per-row gap is jittered deterministically so repeated layouts
  // differ slightly between seeds but stay reproducible for a fixed seed.
  const widest = sized.reduce((m, s) => Math.max(m, s.rect.w), ftToMm(1));
  let cursorY = 0;
  for (const s of sized) {
    const gap = ftToMm(2) + rng() * ftToMm(2);
    s.rect.x = (widest - s.rect.w) / 2;
    s.rect.y = cursorY;
    cursorY += s.rect.h + gap;
  }
  // Trailing gap is not counted toward the site height.
  const siteHeight = sized.length > 0 ? cursorY - ftToMm(2) : ftToMm(1);

  const elements: HardscapeElement[] = sized.map(({ request, rect, index }) => {
    const polygon = rectPolygon(rect);
    const sameKind = brief.elements.filter((e) => e.kind === request.kind);
    const ordinal =
      sameKind.length > 1
        ? ` ${sameKind.indexOf(request) + 1}`
        : "";
    return {
      id: `hardscape-${request.kind}-${index}`,
      kind: request.kind,
      material: request.material,
      polygon,
      areaSqft: roundArea(polygonAreaSqft(polygon)),
      label: `${LABEL_BY_KIND[request.kind]}${ordinal}`,
    };
  });

  // --- 3. Decorative options ------------------------------------------------
  const decor: HardscapeDecor = brief.decor;
  let decorIdx = 0;

  if (decor.bandedBorder) {
    // Frame the largest eligible slab (patio / pool-deck).
    const eligible = sized
      .filter((s) => BORDER_ELIGIBLE.has(s.request.kind))
      .sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h);
    const host = eligible[0];
    if (host) {
      const borderMaterial: HardscapeMaterial =
        decor.borderMaterial ?? "natural-stone";
      elements.push(
        bandedBorderElement(
          host.rect,
          borderMaterial,
          `hardscape-decor-border-${decorIdx++}`,
        ),
      );
    }
  }

  if (decor.medallionInlay) {
    // Drop a medallion at the largest patio.
    const patios = sized
      .filter((s) => s.request.kind === "patio")
      .sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h);
    const host = patios[0];
    if (host) {
      elements.push(
        medallionElement(
          host.rect,
          host.request.material,
          `hardscape-decor-medallion-${decorIdx++}`,
        ),
      );
    }
  }

  // --- 4. Totals & bounds ---------------------------------------------------
  const totalAreaSqft = roundArea(
    elements.reduce((sum, e) => sum + e.areaSqft, 0),
  );

  return {
    schemaVersion: 1,
    seed,
    elements,
    totalAreaSqft,
    bounds: {
      width: round(Math.max(widest, ftToMm(1))),
      height: round(Math.max(siteHeight, ftToMm(1))),
    },
  };
}
