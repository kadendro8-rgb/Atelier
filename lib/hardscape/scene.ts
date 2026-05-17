// Atelier — hardscape 3D scene builder.
//
// Mirrors `lib/kernel/scene.ts` (the home floor-plan kernel's scene builder),
// but for a `HardscapePlan` — a set of free-standing exterior surfaces rather
// than an enclosed building.
//
// Each `HardscapeElement` polygon (a closed mm ring on the XY plane) is
// extruded into a slab of a sensible per-kind thickness, sitting on a ground
// plane. The kernel works in millimeters; this module converts to meters (the
// conventional three.js unit) so the renderer stays unit-agnostic.
//
// Coordinates: plan `x` maps to scene X, plan `y` maps to scene Z, and the
// extrusion axis is scene Y (up). The site footprint is centered on the origin
// so an orbit camera frames the model without extra math.

import type {
  HardscapeElement,
  HardscapeElementKind,
  HardscapeMaterial,
  HardscapePlan,
  Vec2,
} from "./types";

/** Millimeters → meters. */
const MM_TO_M = 0.001;

/**
 * DECISION: hardscape plans carry no per-element thickness, so we assign a
 * realistic slab depth per kind. A poured patio/driveway is ~100 mm; steps
 * read as a chunkier mass; a decorative border/medallion is a thin inlay that
 * sits just proud of the slab it frames.
 */
const THICKNESS_MM_BY_KIND: Record<HardscapeElementKind, number> = {
  driveway: 130,
  walkway: 90,
  patio: 110,
  "pool-deck": 110,
  steps: 360,
  border: 70,
};

/**
 * DECISION: decorative borders/medallions are drawn last in 2D, layered over
 * the slab they frame. In 3D we lift them a hair above the host slab's top so
 * the inlay reads crisply and never z-fights with the surface beneath it.
 */
const DECOR_LIFT_M = 0.004;

/** A renderable triangle mesh: flat vertex/index arrays plus material tags. */
export type HardscapeMeshData = {
  id: string;
  /** Flat `[x, y, z, ...]` positions in meters. */
  positions: number[];
  /** Triangle indices into `positions`. */
  indices: number[];
  /** The element kind — drives slab thickness and any UI affordances. */
  kind: HardscapeElementKind;
  /** The surface material — resolved to a PBR preset by the viewport. */
  material: HardscapeMaterial;
  /** Human-readable element label, carried through for diagnostics. */
  label: string;
};

/** Intermediate 3D model derived from a hardscape plan, consumed by the viewport. */
export type HardscapeSceneModel = {
  plan: HardscapePlan;
  /** Extruded slab meshes, in meters, centered on the origin. */
  meshes: HardscapeMeshData[];
  /** Site extents in meters, for camera framing. */
  size: { width: number; depth: number; height: number };
  /** Mesh count, for quick diagnostics. */
  meshCount: number;
};

/** Origin offset that recenters a site footprint on the scene origin. */
type Center = { x: number; z: number };

/** Convert a plan-space point (mm) to centered scene-space (m) on the XZ plane. */
function toScene(p: Vec2, c: Center): { x: number; z: number } {
  return { x: p.x * MM_TO_M - c.x, z: p.y * MM_TO_M - c.z };
}

/** Signed area of a closed XZ ring — positive when wound counter-clockwise. */
function signedArea(ring: { x: number; z: number }[]): number {
  let a2 = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    a2 += p.x * q.z - q.x * p.z;
  }
  return a2 / 2;
}

/**
 * Fan-triangulate a convex (or near-convex) polygon ring.
 *
 * DECISION: every element the hardscape kernel emits is an axis-aligned
 * rectangle (`rectPolygon` in `generate.ts`), so a triangle fan from vertex 0
 * is exact. Should the kernel ever emit concave rings, the fan still produces
 * watertight side walls and a plausible cap — adequate massing — and the
 * TODO below tracks a real ear-clipping pass.
 *
 * TODO(v2): ear-clipping triangulation for arbitrary concave element rings.
 */
function fanIndices(vertexCount: number): [number, number, number][] {
  const tris: [number, number, number][] = [];
  for (let i = 1; i < vertexCount - 1; i++) {
    tris.push([0, i, i + 1]);
  }
  return tris;
}

/**
 * Extrude one element polygon into a 3D slab and append it as a mesh.
 *
 * The ring sits with its underside at `baseY` and its top face at
 * `baseY + thickness`. Both caps are triangulated and the perimeter is walled
 * so the slab has visible depth from every angle.
 */
function buildSlab(
  element: HardscapeElement,
  center: Center,
  baseY: number,
  thicknessM: number,
): HardscapeMeshData {
  const mesh: HardscapeMeshData = {
    id: element.id,
    positions: [],
    indices: [],
    kind: element.kind,
    material: element.material,
    label: element.label,
  };

  // Project the ring to centered scene space and normalize winding so the top
  // cap's normals face up (and side-wall winding stays consistent).
  let ring = element.polygon.map((p) => toScene(p, center));
  if (ring.length < 3) return mesh;
  if (signedArea(ring) < 0) ring = [...ring].reverse();

  const n = ring.length;
  const topY = baseY + thicknessM;

  // --- Top cap (normals up) -------------------------------------------------
  for (const v of ring) mesh.positions.push(v.x, topY, v.z);
  for (const [a, b, c] of fanIndices(n)) {
    mesh.indices.push(a, b, c);
  }

  // --- Bottom cap (normals down → reverse winding) --------------------------
  const bottomBase = mesh.positions.length / 3;
  for (const v of ring) mesh.positions.push(v.x, baseY, v.z);
  for (const [a, b, c] of fanIndices(n)) {
    mesh.indices.push(bottomBase + a, bottomBase + c, bottomBase + b);
  }

  // --- Perimeter side walls -------------------------------------------------
  for (let i = 0; i < n; i++) {
    const cur = ring[i];
    const next = ring[(i + 1) % n];
    const base = mesh.positions.length / 3;
    // Quad: cur-bottom, next-bottom, next-top, cur-top.
    mesh.positions.push(cur.x, baseY, cur.z);
    mesh.positions.push(next.x, baseY, next.z);
    mesh.positions.push(next.x, topY, next.z);
    mesh.positions.push(cur.x, topY, cur.z);
    mesh.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  return mesh;
}

/**
 * Build the extruded 3D scene from a hardscape plan: one slab mesh per
 * element, each at a sensible per-kind thickness, sitting on the ground plane.
 * Returns plain geometry data in meters, centered on the origin.
 *
 * TODO(v2): true parcel-aware siting + sub-base/edging detail; textured PBR
 * material maps per surface (see `lib/three/hardscapeMaterials.ts`).
 */
export function buildHardscapeScene(plan: HardscapePlan): HardscapeSceneModel {
  const center: Center = {
    x: plan.bounds.width * MM_TO_M * 0.5,
    z: plan.bounds.height * MM_TO_M * 0.5,
  };

  const meshes: HardscapeMeshData[] = [];
  let maxTop = 0;

  for (const element of plan.elements) {
    const thicknessM =
      (THICKNESS_MM_BY_KIND[element.kind] ?? 100) * MM_TO_M;
    // Decorative inlays float a hair above the ground so they read as a
    // surface treatment layered onto the slabs they frame, not a floating mass.
    const baseY = element.kind === "border" ? DECOR_LIFT_M : 0;
    const slab = buildSlab(element, center, baseY, thicknessM);
    if (slab.indices.length === 0) continue;
    meshes.push(slab);
    maxTop = Math.max(maxTop, baseY + thicknessM);
  }

  return {
    plan,
    meshes,
    size: {
      width: plan.bounds.width * MM_TO_M,
      depth: plan.bounds.height * MM_TO_M,
      height: Math.max(maxTop, 0.1),
    },
    meshCount: meshes.length,
  };
}
