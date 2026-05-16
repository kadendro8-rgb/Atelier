import type { PlanGraph, RoofType, Vec2 } from "./types";

/**
 * Intermediate 3D model derived from a plan graph, consumed by Viewport3D.
 *
 * The kernel works in millimeters; this module converts to meters (the
 * conventional three.js unit) so the renderer can stay unit-agnostic.
 *
 * Coordinates: plan `x` maps to scene X, plan `y` maps to scene Z, and the
 * extrusion axis is scene Y (up). The footprint is centered on the origin so
 * the orbit camera frames the model without extra math.
 */

/** Millimeters → meters. */
const MM_TO_M = 0.001;

/** DECISION: spec gives no global wall height, so we use a 2.7 m default. */
const WALL_HEIGHT_M = 2.7;

/** DECISION: floor slab thickness — not in the graph, fixed at 200 mm. */
const SLAB_THICKNESS_M = 0.2;

/** DECISION: roof pitch rise for gable/hip/shed massing, in meters. */
const ROOF_RISE_M = 2.0;

/** A renderable triangle mesh: flat vertex/index arrays plus a material tag. */
export type MeshData = {
  id: string;
  /** Flat `[x, y, z, ...]` positions in meters. */
  positions: number[];
  /** Triangle indices into `positions`. */
  indices: number[];
  /** Which PBR material the component should assign. */
  material: "wall" | "floor" | "roof";
};

/** Intermediate 3D model derived from a plan graph, consumed by Viewport3D. */
export type SceneModel = {
  graph: PlanGraph;
  /** Extruded wall / slab / roof meshes, in meters, centered on the origin. */
  meshes: MeshData[];
  /** Footprint extents in meters, for camera framing. */
  size: { width: number; depth: number; height: number };
  /** Mesh count, for quick diagnostics. */
  meshCount: number;
};

/** Origin offset that recenters a graph footprint on the scene origin. */
type Center = { x: number; z: number };

/** Convert a plan-space point (mm) to centered scene-space (m) on the XZ plane. */
function toScene(p: Vec2, c: Center): { x: number; z: number } {
  return { x: p.x * MM_TO_M - c.x, z: p.y * MM_TO_M - c.z };
}

/**
 * Append a flat horizontal quad (constant Y) to a mesh buffer.
 * Winding is chosen so the surface normal points up when `faceUp` is true.
 */
function pushQuadY(
  mesh: MeshData,
  a: { x: number; z: number },
  b: { x: number; z: number },
  cc: { x: number; z: number },
  d: { x: number; z: number },
  y: number,
  faceUp: boolean,
): void {
  const base = mesh.positions.length / 3;
  for (const v of [a, b, cc, d]) {
    mesh.positions.push(v.x, y, v.z);
  }
  if (faceUp) {
    mesh.indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
  } else {
    mesh.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}

/** Append a vertical quad spanning [y0, y1] between two XZ points. */
function pushQuadVertical(
  mesh: MeshData,
  a: { x: number; z: number },
  b: { x: number; z: number },
  y0: number,
  y1: number,
): void {
  const base = mesh.positions.length / 3;
  mesh.positions.push(a.x, y0, a.z);
  mesh.positions.push(b.x, y0, b.z);
  mesh.positions.push(b.x, y1, b.z);
  mesh.positions.push(a.x, y1, a.z);
  mesh.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

/** Append a triangle from three explicit 3D points. */
function pushTri(
  mesh: MeshData,
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number],
): void {
  const base = mesh.positions.length / 3;
  mesh.positions.push(...a, ...b, ...c);
  mesh.indices.push(base, base + 1, base + 2);
}

/**
 * Extrude a single wall edge into a box. The wall runs from `start` to `end`
 * with a given thickness, sitting on top of the floor slab.
 */
function buildWall(
  mesh: MeshData,
  startMm: Vec2,
  endMm: Vec2,
  thicknessMm: number,
  c: Center,
  baseY: number,
): void {
  const s = toScene(startMm, c);
  const e = toScene(endMm, c);
  const dx = e.x - s.x;
  const dz = e.z - s.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return;

  // Unit normal perpendicular to the wall direction, scaled by half thickness.
  const half = thicknessMm * MM_TO_M * 0.5;
  const nx = (-dz / len) * half;
  const nz = (dx / len) * half;

  // Four footprint corners of the wall box.
  const p0 = { x: s.x + nx, z: s.z + nz };
  const p1 = { x: e.x + nx, z: e.z + nz };
  const p2 = { x: e.x - nx, z: e.z - nz };
  const p3 = { x: s.x - nx, z: s.z - nz };

  const top = baseY + WALL_HEIGHT_M;

  // Four side faces.
  pushQuadVertical(mesh, p0, p1, baseY, top);
  pushQuadVertical(mesh, p1, p2, baseY, top);
  pushQuadVertical(mesh, p2, p3, baseY, top);
  pushQuadVertical(mesh, p3, p0, baseY, top);
  // Cap (top) — bottom face is hidden against the slab so it is skipped.
  pushQuadY(mesh, p0, p1, p2, p3, top, true);
}

/** Axis-aligned bounding box of a set of XZ points. */
function bbox(pts: { x: number; z: number }[]): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  return { minX, maxX, minZ, maxZ };
}

/**
 * Build a simple roof mass over the footprint bounding box.
 *
 * DECISION: rooms are arbitrary polygons, so a faithful roof per room is out
 * of CORE scope. We roof the overall footprint AABB — clean massing that
 * still reads as the correct roof archetype.
 * TODO(v2): true per-ridge roof framing that follows the room polygons.
 */
function buildRoof(
  mesh: MeshData,
  roof: RoofType,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  eaveY: number,
): void {
  const c00: [number, number, number] = [minX, eaveY, minZ];
  const c10: [number, number, number] = [maxX, eaveY, minZ];
  const c11: [number, number, number] = [maxX, eaveY, maxZ];
  const c01: [number, number, number] = [minX, eaveY, maxZ];

  if (roof === "flat") {
    // A thin flat slab cap.
    pushQuadY(
      mesh,
      { x: minX, z: minZ },
      { x: maxX, z: minZ },
      { x: maxX, z: maxZ },
      { x: minX, z: maxZ },
      eaveY,
      true,
    );
    return;
  }

  if (roof === "shed") {
    // Single slope rising along +Z.
    const ridgeY = eaveY + ROOF_RISE_M;
    const r01: [number, number, number] = [minX, ridgeY, maxZ];
    const r11: [number, number, number] = [maxX, ridgeY, maxZ];
    // Sloped top face.
    pushTri(mesh, c00, r11, c10);
    pushTri(mesh, c00, r01, r11);
    // Gable ends (triangles) + back wall.
    pushTri(mesh, c00, c01, r01);
    pushTri(mesh, c10, r11, c11);
    pushQuadVertical(
      mesh,
      { x: minX, z: maxZ },
      { x: maxX, z: maxZ },
      eaveY,
      ridgeY,
    );
    return;
  }

  // gable + hip share a ridge running along the X axis.
  const ridgeY = eaveY + ROOF_RISE_M;
  const midZ = (minZ + maxZ) / 2;

  if (roof === "gable") {
    const rA: [number, number, number] = [minX, ridgeY, midZ];
    const rB: [number, number, number] = [maxX, ridgeY, midZ];
    // Two sloped planes.
    pushTri(mesh, c00, rB, c10);
    pushTri(mesh, c00, rA, rB);
    pushTri(mesh, c01, c11, rB);
    pushTri(mesh, c01, rB, rA);
    // Two triangular gable ends.
    pushTri(mesh, c00, c01, rA);
    pushTri(mesh, c10, rB, c11);
    return;
  }

  // hip: ridge shortened so all four faces slope.
  const inset = Math.min((maxX - minX) * 0.25, (maxZ - minZ) * 0.5);
  const rA: [number, number, number] = [minX + inset, ridgeY, midZ];
  const rB: [number, number, number] = [maxX - inset, ridgeY, midZ];
  // Front + back trapezoid slopes.
  pushTri(mesh, c00, rB, c10);
  pushTri(mesh, c00, rA, rB);
  pushTri(mesh, c01, c11, rB);
  pushTri(mesh, c01, rB, rA);
  // Two triangular hip ends.
  pushTri(mesh, c00, c01, rA);
  pushTri(mesh, c10, rB, c11);
}

/**
 * Build the extruded 3D scene from a plan graph: floor slab, extruded walls,
 * and a roof mass per `graph.roof`. Returns plain geometry data in meters.
 *
 * TODO(v2): CSG opening cuts (doors/windows), HDRI + SunCalc lighting,
 * photoreal pathtracer pass, OSM/terrain site context. See docs/v2-spec.md §2.
 */
export function buildScene(graph: PlanGraph): SceneModel {
  const center: Center = {
    x: graph.bounds.width * MM_TO_M * 0.5,
    z: graph.bounds.height * MM_TO_M * 0.5,
  };

  const meshes: MeshData[] = [];

  // --- Floor slab ----------------------------------------------------------
  const floor: MeshData = {
    id: "floor",
    positions: [],
    indices: [],
    material: "floor",
  };
  // DECISION: rooms can be disjoint polygons; rather than triangulate every
  // ring we lay one slab over the footprint AABB — adequate massing for CORE.
  // TODO(v2): per-room polygon-triangulated slabs with finish materials.
  const cornerPts = graph.walls.flatMap((w) => [
    toScene(w.start, center),
    toScene(w.end, center),
  ]);
  const fallbackPts = [
    { x: -center.x, z: -center.z },
    { x: center.x, z: center.z },
  ];
  const box = bbox(cornerPts.length >= 2 ? cornerPts : fallbackPts);
  pushQuadY(
    floor,
    { x: box.minX, z: box.minZ },
    { x: box.maxX, z: box.minZ },
    { x: box.maxX, z: box.maxZ },
    { x: box.minX, z: box.maxZ },
    0,
    true,
  );
  // Slab underside + edges so it has visible depth.
  pushQuadY(
    floor,
    { x: box.minX, z: box.minZ },
    { x: box.maxX, z: box.minZ },
    { x: box.maxX, z: box.maxZ },
    { x: box.minX, z: box.maxZ },
    -SLAB_THICKNESS_M,
    false,
  );
  pushQuadVertical(
    floor,
    { x: box.minX, z: box.minZ },
    { x: box.maxX, z: box.minZ },
    -SLAB_THICKNESS_M,
    0,
  );
  pushQuadVertical(
    floor,
    { x: box.maxX, z: box.minZ },
    { x: box.maxX, z: box.maxZ },
    -SLAB_THICKNESS_M,
    0,
  );
  pushQuadVertical(
    floor,
    { x: box.maxX, z: box.maxZ },
    { x: box.minX, z: box.maxZ },
    -SLAB_THICKNESS_M,
    0,
  );
  pushQuadVertical(
    floor,
    { x: box.minX, z: box.maxZ },
    { x: box.minX, z: box.minZ },
    -SLAB_THICKNESS_M,
    0,
  );
  meshes.push(floor);

  // --- Walls ---------------------------------------------------------------
  const walls: MeshData = {
    id: "walls",
    positions: [],
    indices: [],
    material: "wall",
  };
  for (const w of graph.walls) {
    buildWall(walls, w.start, w.end, w.thicknessMm, center, 0);
  }
  if (walls.indices.length > 0) meshes.push(walls);

  // --- Roof ----------------------------------------------------------------
  const roof: MeshData = {
    id: "roof",
    positions: [],
    indices: [],
    material: "roof",
  };
  buildRoof(roof, graph.roof, box.minX, box.maxX, box.minZ, box.maxZ, WALL_HEIGHT_M);
  if (roof.indices.length > 0) meshes.push(roof);

  const roofRise = graph.roof === "flat" ? 0 : ROOF_RISE_M;

  return {
    graph,
    meshes,
    size: {
      width: box.maxX - box.minX,
      depth: box.maxZ - box.minZ,
      height: WALL_HEIGHT_M + roofRise,
    },
    meshCount: meshes.length,
  };
}
