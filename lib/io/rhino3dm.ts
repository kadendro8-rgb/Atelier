/**
 * Rhino `.3dm` export for the packaging stage — the "partner with Rhino"
 * deliverable.
 *
 * Atelier interoperates with Rhino 3D rather than fighting it: a designer can
 * take an Atelier `home` or `hardscape` design straight into Rhino as a native
 * `.3dm` document. This writer emits each plan element as real Rhino geometry
 * (polyline curves) on named, colour-coded layers, in the same millimetre
 * coordinate space the kernel uses — so the model lands in Rhino to scale,
 * organised, and ready to draft on.
 *
 * Implementation notes:
 *
 *  - `rhino3dm` is McNeel's official WASM build of openNURBS (MIT-licensed).
 *    It is a large WASM module, so — exactly like `jspdf` in `planPdf.ts` — it
 *    is loaded on demand via a dynamic `import()` inside `exportRhino3dm`. It
 *    never enters the `/builder/package` route's initial bundle.
 *  - The geometry walk mirrors `lib/io/dwg.ts` / `lib/io/hardscapeDxf.ts`: the
 *    same `PlanGraph` / `HardscapePlan` shapes feed this. Walls become
 *    centreline polyline curves; room and hardscape rings become closed
 *    polyline curves; door/window openings become short marker curves.
 *  - Output is a real binary `.3dm` archive (`File3dm.toByteArray()`), which
 *    opens in Rhino 6+ and every `.3dm`-aware tool.
 *
 * The whole export is keyless and runs entirely in the browser.
 */

import type {
  HardscapeElement,
  HardscapePlan,
} from "@/lib/hardscape/types";
import type { Opening, PlanGraph, Vec2, Wall } from "@/lib/kernel/types";

/** An RGB colour for a Rhino layer, in the 0–255 object form `rhino3dm` wants. */
interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/* -------------------------------------------------------------------------- */
/* Layer palettes — one per element kind, named for clarity inside Rhino       */
/* -------------------------------------------------------------------------- */

/** Home floor-plan layers, keyed for the geometry walk below. */
const HOME_LAYERS: Record<string, { name: string; color: RgbColor }> = {
  wallExterior: { name: "Walls — Exterior", color: { r: 226, g: 178, b: 110 } },
  wallInterior: { name: "Walls — Interior", color: { r: 138, g: 124, b: 96 } },
  doors: { name: "Openings — Doors", color: { r: 143, g: 161, b: 131 } },
  windows: { name: "Openings — Windows", color: { r: 120, g: 170, b: 200 } },
  rooms: { name: "Rooms", color: { r: 210, g: 138, b: 85 } },
  outline: { name: "Building Outline", color: { r: 240, g: 233, b: 218 } },
};

/** Hardscape site-plan layers, one per element kind. */
const HARDSCAPE_LAYERS: Record<
  HardscapeElement["kind"],
  { name: string; color: RgbColor }
> = {
  driveway: { name: "Hardscape — Driveway", color: { r: 240, g: 233, b: 218 } },
  walkway: { name: "Hardscape — Walkway", color: { r: 143, g: 161, b: 131 } },
  patio: { name: "Hardscape — Patio", color: { r: 226, g: 178, b: 110 } },
  "pool-deck": { name: "Hardscape — Pool Deck", color: { r: 120, g: 170, b: 200 } },
  steps: { name: "Hardscape — Steps", color: { r: 150, g: 140, b: 200 } },
  border: { name: "Hardscape — Border", color: { r: 210, g: 138, b: 85 } },
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Export a home `PlanGraph` as a Rhino `.3dm` document.
 *
 * Returns the file as a `Uint8Array` (raw `.3dm` bytes), or `null` if the WASM
 * module fails to load — callers degrade gracefully, matching `exportPlanPdf`.
 */
export async function exportHomeRhino3dm(
  graph: PlanGraph,
): Promise<Uint8Array | null> {
  const rhino = await loadRhino();
  if (!rhino) return null;

  const doc = newDocument(rhino);
  const layerIndex = registerLayers(rhino, doc, Object.values(HOME_LAYERS));

  // Index walls so openings can be placed along their host wall centreline.
  const wallById = new Map<string, Wall>();
  for (const w of graph.walls) wallById.set(w.id, w);

  // --- Walls — centreline polyline curves -------------------------------
  for (const w of graph.walls) {
    const layer =
      layerIndex[
        w.kind === "exterior"
          ? HOME_LAYERS.wallExterior.name
          : HOME_LAYERS.wallInterior.name
      ];
    addPolylineCurve(
      rhino,
      doc,
      [w.start, w.end],
      false,
      layer,
      `Wall ${w.kind}`,
    );
  }

  // --- Openings — short marker curves across the wall gap ---------------
  for (const o of graph.openings) {
    const wall = wallById.get(o.wallId);
    if (!wall) continue;
    const isWindow = o.kind === "window";
    const layer =
      layerIndex[
        isWindow ? HOME_LAYERS.windows.name : HOME_LAYERS.doors.name
      ];
    const span = openingSpan(wall, o);
    if (span) {
      addPolylineCurve(rhino, doc, span, false, layer, `Opening ${o.kind}`);
    }
  }

  // --- Rooms — closed polyline rings ------------------------------------
  const roomLayer = layerIndex[HOME_LAYERS.rooms.name];
  for (const room of graph.rooms) {
    if (room.polygon.length >= 3) {
      addPolylineCurve(
        rhino,
        doc,
        room.polygon,
        true,
        roomLayer,
        `${room.label} (${Math.round(room.areaSqft)} SF)`,
      );
    }
  }

  // --- Building outline — the overall footprint rectangle ---------------
  const { width, height } = graph.bounds;
  addPolylineCurve(
    rhino,
    doc,
    [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
    true,
    layerIndex[HOME_LAYERS.outline.name],
    "Building outline",
  );

  return doc.toByteArray();
}

/**
 * Export a `HardscapePlan` as a Rhino `.3dm` document — the sibling of
 * `exportHomeRhino3dm` for the exterior site kernel.
 */
export async function exportHardscapeRhino3dm(
  plan: HardscapePlan,
): Promise<Uint8Array | null> {
  const rhino = await loadRhino();
  if (!rhino) return null;

  const doc = newDocument(rhino);
  // Only register layers for kinds actually present, so the Rhino layer panel
  // is not cluttered with empty layers.
  const presentKinds = new Set(plan.elements.map((e) => e.kind));
  const used = [...presentKinds].map((k) => HARDSCAPE_LAYERS[k]);
  const layerIndex = registerLayers(rhino, doc, used);

  for (const el of plan.elements) {
    if (el.polygon.length < 3) continue;
    const layer = layerIndex[HARDSCAPE_LAYERS[el.kind].name];
    addPolylineCurve(
      rhino,
      doc,
      el.polygon,
      true,
      layer,
      `${el.label} (${Math.round(el.areaSqft)} SF)`,
    );
  }

  return doc.toByteArray();
}

/* -------------------------------------------------------------------------- */
/* rhino3dm internals                                                          */
/* -------------------------------------------------------------------------- */

/** A loosely-typed handle to the resolved `rhino3dm` WASM module. */
// rhino3dm's `.d.ts` types the module as `RhinoModule` but does not export the
// member classes individually; a structural alias keeps this file strict.
type RhinoModule = Awaited<ReturnType<typeof importRhino>>;

/** The dynamic `import()` isolated so its type can be inferred above. */
async function importRhino() {
  const mod = await import("rhino3dm");
  return mod.default();
}

/**
 * Lazily load the `rhino3dm` WASM module. Resolves to the module, or `null` if
 * the WASM build cannot be instantiated (so callers degrade gracefully).
 *
 * The dynamic `import()` keeps the WASM payload out of the route's initial
 * bundle — it is only fetched the first time a user triggers a `.3dm` export.
 */
async function loadRhino(): Promise<RhinoModule | null> {
  try {
    return await importRhino();
  } catch {
    return null;
  }
}

/**
 * Create a fresh `.3dm` document with sensible metadata and millimetre model
 * units — the kernel's native coordinate space, so geometry needs no scaling.
 */
function newDocument(rhino: RhinoModule): InstanceType<RhinoModule["File3dm"]> {
  const doc = new rhino.File3dm();
  doc.applicationName = "Atelier";
  doc.applicationDetails = "Atelier — design studio for outdoor living & homes";
  doc.applicationUrl = "https://atelier.design";
  // The kernel works in millimetres; declare the model unit system to match so
  // the design lands in Rhino at true scale. `Millimeters` === enum index 4.
  const settings = doc.settings();
  settings.modelUnitSystem = rhino.UnitSystem.Millimeters;
  return doc;
}

/**
 * Register a set of layers on the document, returning a name → layer-index map
 * so geometry can be filed onto the right layer.
 */
function registerLayers(
  rhino: RhinoModule,
  doc: InstanceType<RhinoModule["File3dm"]>,
  layers: { name: string; color: RgbColor }[],
): Record<string, number> {
  const index: Record<string, number> = {};
  const table = doc.layers();
  for (const { name, color } of layers) {
    if (index[name] !== undefined) continue;
    index[name] = table.addLayer(name, color);
  }
  return index;
}

/**
 * Add a polyline curve built from kernel `Vec2` points (z = 0, the plan is
 * flat) onto the given layer. When `closed` is true the ring's first vertex is
 * repeated so Rhino reads the curve as closed.
 */
function addPolylineCurve(
  rhino: RhinoModule,
  doc: InstanceType<RhinoModule["File3dm"]>,
  points: Vec2[],
  closed: boolean,
  layerIndex: number,
  name: string,
): void {
  const coords: number[][] = points.map((p) => [p.x, p.y, 0]);
  if (closed && coords.length > 0) {
    coords.push([...coords[0]]);
  }
  const curve = new rhino.PolylineCurve(coords);
  const attrs = new rhino.ObjectAttributes();
  attrs.layerIndex = layerIndex;
  attrs.name = name;
  // `addCurve` accepts an `(curve, attributes)` overload at runtime — the
  // shipped `.d.ts` only declares the single-argument form, so the table is
  // narrowed locally to the overload that actually exists.
  (doc.objects() as ObjectTableWithAttrs).addCurve(curve, attrs);
  // `delete()` frees the WASM-side object; it lives on `CommonObject` but is
  // likewise absent from the published types.
  freeWasm(curve);
  freeWasm(attrs);
}

/** The `addCurve(curve, attributes)` overload missing from the shipped types. */
interface ObjectTableWithAttrs {
  addCurve(
    curve: InstanceType<RhinoModule["PolylineCurve"]>,
    attributes: InstanceType<RhinoModule["ObjectAttributes"]>,
  ): string;
}

/** Release a WASM-backed object if it exposes the (untyped) `delete()` method. */
function freeWasm(obj: unknown): void {
  const disposable = obj as { delete?: () => void };
  if (typeof disposable.delete === "function") disposable.delete();
}

/**
 * The two endpoints of an opening, projected along its host wall centreline —
 * a short marker curve showing where a door or window sits.
 */
function openingSpan(wall: Wall, o: Opening): [Vec2, Vec2] | null {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const offset = Math.min(Math.max(o.offsetMm, 0), Math.max(len - o.widthMm, 0));
  const a: Vec2 = {
    x: wall.start.x + ux * offset,
    y: wall.start.y + uy * offset,
  };
  const b: Vec2 = { x: a.x + ux * o.widthMm, y: a.y + uy * o.widthMm };
  return [a, b];
}
