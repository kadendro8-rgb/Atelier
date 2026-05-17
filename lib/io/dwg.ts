import Drawing from "dxf-writer";
import type { Opening, PlanGraph, Vec2, Wall } from "@/lib/kernel/types";

/**
 * Export a plan graph as AutoCAD R12 ASCII DXF.
 *
 * Emits walls, openings and room outlines onto AIA CAD-standard layers using
 * the `dxf-writer` package. The kernel works in millimeters, so the drawing
 * declares millimeter units. See docs/v2-spec.md §3.3.
 *
 * AIA layers emitted:
 *  - A-WALL      interior walls / partitions
 *  - A-WALL-EXT  exterior walls
 *  - A-DOOR      door openings (leaf + swing arc)
 *  - A-WIND      window openings
 *  - A-ANNO      room outlines, labels and annotations
 */
export function exportDWG(graph: PlanGraph): string {
  const d = new Drawing();
  d.setUnits("Millimeters");

  // AIA-standard layers with conventional ACI colors.
  d.addLayer("A-WALL", Drawing.ACI.WHITE, "CONTINUOUS");
  d.addLayer("A-WALL-EXT", Drawing.ACI.YELLOW, "CONTINUOUS");
  d.addLayer("A-DOOR", Drawing.ACI.GREEN, "CONTINUOUS");
  d.addLayer("A-WIND", Drawing.ACI.CYAN, "CONTINUOUS");
  d.addLayer("A-ANNO", Drawing.ACI.MAGENTA, "CONTINUOUS");

  // Index walls so openings can be placed along their host wall.
  const wallById = new Map<string, Wall>();
  for (const w of graph.walls) {
    wallById.set(w.id, w);
  }

  // --- Walls --------------------------------------------------------------
  // DECISION: walls are modelled by the kernel as single-line centerline
  // edges with a thickness attribute; we emit the centerline polyline on the
  // appropriate layer rather than synthesizing a two-sided wall solid.
  for (const w of graph.walls) {
    d.setActiveLayer(w.kind === "exterior" ? "A-WALL-EXT" : "A-WALL");
    d.drawLine(w.start.x, w.start.y, w.end.x, w.end.y);
  }

  // --- Openings -----------------------------------------------------------
  for (const o of graph.openings) {
    const wall = wallById.get(o.wallId);
    if (!wall) continue;
    drawOpening(d, wall, o);
  }

  // --- Room outlines & labels --------------------------------------------
  d.setActiveLayer("A-ANNO");
  for (const room of graph.rooms) {
    if (room.polygon.length >= 2) {
      const points = room.polygon.map((p): [number, number] => [p.x, p.y]);
      d.drawPolyline(points, true);
    }
    const c = centroid(room.polygon);
    if (c) {
      const label = `${room.label} (${Math.round(room.areaSqft)} SF)`;
      d.drawText(c.x, c.y, 200, 0, label, "center", "middle");
    }
  }

  return d.toDxfString();
}

/** Emit a single opening (door leaf + swing, or window) along its wall. */
function drawOpening(d: Drawing, wall: Wall, o: Opening): void {
  const len = distance(wall.start, wall.end);
  if (len === 0) return;

  // Unit vector along the wall and its perpendicular.
  const ux = (wall.end.x - wall.start.x) / len;
  const uy = (wall.end.y - wall.start.y) / len;
  const px = -uy;
  const py = ux;

  // Opening endpoints along the wall centerline.
  const a: Vec2 = {
    x: wall.start.x + ux * o.offsetMm,
    y: wall.start.y + uy * o.offsetMm,
  };
  const b: Vec2 = {
    x: a.x + ux * o.widthMm,
    y: a.y + uy * o.widthMm,
  };

  if (o.kind === "window") {
    d.setActiveLayer("A-WIND");
    // Double-stroke window symbol offset to either face of the wall.
    const off = wall.thicknessMm / 2;
    d.drawLine(a.x + px * off, a.y + py * off, b.x + px * off, b.y + py * off);
    d.drawLine(a.x - px * off, a.y - py * off, b.x - px * off, b.y - py * off);
    return;
  }

  // Doors, cased openings and garage doors all carry on the A-DOOR layer.
  d.setActiveLayer("A-DOOR");
  // Door leaf gap shown as the jamb line across the opening.
  d.drawLine(a.x, a.y, b.x, b.y);

  if (o.kind === "door") {
    // 90° swing arc. swing === "right" mirrors the hinge to the far jamb.
    const hinge = o.swing === "right" ? b : a;
    const leaf = o.swing === "right" ? a : b;
    // Leaf line drawn open at 90°.
    const leafEndX = hinge.x + px * o.widthMm;
    const leafEndY = hinge.y + py * o.widthMm;
    d.drawLine(hinge.x, hinge.y, leafEndX, leafEndY);
    // Swing arc between the closed leaf position and the open position.
    const startAngle = degrees(Math.atan2(leaf.y - hinge.y, leaf.x - hinge.x));
    const endAngle = degrees(
      Math.atan2(leafEndY - hinge.y, leafEndX - hinge.x),
    );
    d.drawArc(hinge.x, hinge.y, o.widthMm, startAngle, endAngle);
  }
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
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
