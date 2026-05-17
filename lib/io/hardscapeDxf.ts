import Drawing from "dxf-writer";
import type { HardscapeElement, HardscapePlan, Vec2 } from "@/lib/hardscape/types";

/**
 * Export a hardscape site plan as AutoCAD R12 ASCII DXF.
 *
 * The home exporter in `lib/io/dwg.ts` is building-only; this is its sibling
 * for the exterior site kernel. Each placed element's polygon is emitted as a
 * closed polyline on a layer keyed to the element kind, with the element's
 * label drawn as text at the ring centroid. The kernel works in millimeters,
 * so the drawing declares millimeter units — the same convention as `dwg.ts`.
 *
 * Despite the historical "DWG" naming around CAD exports, this — like
 * `exportDWG` — produces ASCII DXF text (AutoCAD R12), which opens in AutoCAD
 * and every major CAD tool. True binary DWG requires the commercial ODA SDK
 * (see docs/atelier-desktop.md §3, Rule 2) and ships with the desktop product.
 *
 * Layers emitted, one per hardscape element kind:
 *  - HS-DRIVEWAY   vehicle approach / parking apron
 *  - HS-WALKWAY    paths
 *  - HS-PATIO      patios
 *  - HS-POOL-DECK  pool decks
 *  - HS-STEPS      step runs
 *  - HS-BORDER     decorative borders / ribbons
 *  - HS-ANNO       element labels and annotations
 */

/** Layer name + conventional ACI colour for each hardscape element kind. */
const KIND_LAYERS: Record<
  HardscapeElement["kind"],
  { layer: string; color: number }
> = {
  driveway: { layer: "HS-DRIVEWAY", color: Drawing.ACI.WHITE },
  walkway: { layer: "HS-WALKWAY", color: Drawing.ACI.GREEN },
  patio: { layer: "HS-PATIO", color: Drawing.ACI.YELLOW },
  "pool-deck": { layer: "HS-POOL-DECK", color: Drawing.ACI.CYAN },
  steps: { layer: "HS-STEPS", color: Drawing.ACI.BLUE },
  border: { layer: "HS-BORDER", color: Drawing.ACI.MAGENTA },
};

export function exportHardscapeDXF(plan: HardscapePlan): string {
  const d = new Drawing();
  d.setUnits("Millimeters");

  // One layer per element kind, plus an annotation layer.
  for (const { layer, color } of Object.values(KIND_LAYERS)) {
    d.addLayer(layer, color, "CONTINUOUS");
  }
  d.addLayer("HS-ANNO", Drawing.ACI.WHITE, "CONTINUOUS");

  // --- Element polygons ---------------------------------------------------
  // Each element is one closed polygon ring; emit it as a closed polyline on
  // its kind's layer. The kernel stores rings without the first vertex
  // repeated, which is exactly what `drawPolyline(points, true)` expects.
  for (const el of plan.elements) {
    if (el.polygon.length < 2) continue;
    d.setActiveLayer(KIND_LAYERS[el.kind].layer);
    const points = el.polygon.map((p): [number, number] => [p.x, p.y]);
    d.drawPolyline(points, true);
  }

  // --- Labels -------------------------------------------------------------
  d.setActiveLayer("HS-ANNO");
  for (const el of plan.elements) {
    const c = centroid(el.polygon);
    if (!c) continue;
    const label = `${el.label} (${Math.round(el.areaSqft)} SF)`;
    d.drawText(c.x, c.y, 200, 0, label, "center", "middle");
  }

  return d.toDxfString();
}

/** Area-weighted centroid of a closed polygon ring, or null if degenerate. */
function centroid(ring: Vec2[]): Vec2 | null {
  if (ring.length === 0) return null;
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    const cross = p.x * q.y - q.x * p.y;
    area += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  if (area === 0) {
    // Degenerate ring: fall back to the simple vertex average.
    const sum = ring.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 },
    );
    return { x: sum.x / ring.length, y: sum.y / ring.length };
  }
  area *= 0.5;
  return { x: cx / (6 * area), y: cy / (6 * area) };
}
