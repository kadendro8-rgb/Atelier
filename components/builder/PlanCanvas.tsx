"use client";

import { useMemo } from "react";
import { DraftingOverlay } from "@/components/builder/DraftingOverlay";
import { formatFeetInches } from "@/lib/drafting";
import type { CodeViolation } from "@/lib/kernel/codeCheck";
import type {
  Opening,
  PlanGraph,
  RoomZone,
  Vec2,
  Wall,
} from "@/lib/kernel/types";

/* -------------------------------------------------------------------------- */
/* Units & geometry                                                           */
/* -------------------------------------------------------------------------- */

const MM_PER_FT = 304.8;

/** Quantised edge key matching the kernel, so a room can find its walls. */
function edgeKey(a: Vec2, b: Vec2): string {
  const k = (v: Vec2) => `${Math.round(v.x)},${Math.round(v.y)}`;
  return [k(a), k(b)].sort().join("~");
}

/** Centroid of a closed polygon ring (vertex average — rooms are rectangles). */
function centroid(poly: Vec2[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  return { x: x / poly.length, y: y / poly.length };
}

/** Axis-aligned bounding box of a polygon ring. */
function bbox(poly: Vec2[]): { w: number; h: number } {
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
  return { w: maxX - minX, h: maxY - minY };
}

/* -------------------------------------------------------------------------- */
/* Palette — CAD-grade on the dark theme                                      */
/* -------------------------------------------------------------------------- */

// Zone tints mirror lib/design.ts so the canvas reads consistently with the
// rest of the builder.
const ZONE_FILL: Record<RoomZone, string> = {
  public: "rgba(210,138,85,0.13)",
  private: "rgba(143,161,131,0.12)",
  service: "rgba(66,58,44,0.50)",
  outdoor: "rgba(143,161,131,0.06)",
};

const ZONE_TEXT: Record<RoomZone, string> = {
  public: "#ecab78",
  private: "#a9bd9d",
  service: "#a89e8c",
  outdoor: "#8fa183",
};

const WALL_EXTERIOR = "#5a4f3a";
const WALL_INTERIOR = "#423a2c";
const OPENING_COLOR = "#ecab78";
const VIOLATION_COLOR = "#e0654b";

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Read-only SVG floor-plan renderer.
 *
 * Draws a `PlanGraph` to scale: room polygons with zone tints, centered
 * labels and square footage; walls as strokes scaled by thickness (exterior
 * heavier than interior); door openings as 90° swing arcs and windows as
 * double strokes. Rooms flagged by `validatePlan` carry a code-violation
 * badge.
 *
 * TODO(v2): zoom/pan, drag-to-edit with a solver re-run, a room inspector and
 * the floating toolbar. See docs/v2-spec.md §1.2.
 */
export function PlanCanvas({
  graph,
  violations = [],
}: {
  graph: PlanGraph;
  violations?: CodeViolation[];
}) {
  const { width, height } = graph.bounds;

  // Index walls by id and by edge key once per graph.
  const wallById = useMemo(() => {
    const m = new Map<string, Wall>();
    for (const w of graph.walls) m.set(w.id, w);
    return m;
  }, [graph.walls]);

  // Map each room → the set of code-violation rule ids targeting it. The room
  // is the badge anchor, but violations can also target the room's openings,
  // so we resolve opening ids back to their host room via the wall→room walls.
  const violationsByRoom = useMemo(() => {
    const wallByKey = new Map<string, Wall>();
    for (const w of graph.walls) wallByKey.set(edgeKey(w.start, w.end), w);

    // opening id → host wall id
    const openingWall = new Map<string, string>();
    for (const op of graph.openings) openingWall.set(op.id, op.wallId);

    // wall id → rooms touching that wall
    const roomsByWall = new Map<string, string[]>();
    for (const room of graph.rooms) {
      const poly = room.polygon;
      for (let i = 0; i < poly.length; i++) {
        const w = wallByKey.get(edgeKey(poly[i], poly[(i + 1) % poly.length]));
        if (!w) continue;
        const list = roomsByWall.get(w.id);
        if (list) list.push(room.id);
        else roomsByWall.set(w.id, [room.id]);
      }
    }

    const out = new Map<string, CodeViolation[]>();
    const add = (roomId: string, v: CodeViolation) => {
      const list = out.get(roomId);
      if (list) list.push(v);
      else out.set(roomId, [v]);
    };
    const roomIds = new Set(graph.rooms.map((r) => r.id));
    for (const v of violations) {
      if (roomIds.has(v.objectId)) {
        add(v.objectId, v);
        continue;
      }
      // The violation targets an opening or a wall — badge every room on it.
      const wallId = openingWall.get(v.objectId) ?? v.objectId;
      for (const roomId of roomsByWall.get(wallId) ?? []) add(roomId, v);
    }
    return out;
  }, [graph.rooms, graph.walls, graph.openings, violations]);

  // Asymmetric padding: a generous margin on the bottom/left for the dimension
  // lines + scale bar, a lighter one on the top/right for the north arrow.
  const span = Math.max(width, height);
  const padTop = span * 0.1;
  const padRight = span * 0.1;
  const padLeft = span * 0.12;
  const padBottom = span * 0.2;
  const vbW = width + padLeft + padRight;
  const vbH = height + padTop + padBottom;
  const viewBox = `${-padLeft} ${-padTop} ${vbW} ${vbH}`;

  // Stroke widths derived from the footprint so the line weight reads the same
  // at any plan size.
  const unit = span / 100;
  const exteriorStroke = unit * 1.6;
  const interiorStroke = unit * 0.9;
  const labelSize = unit * 3.4;
  const areaSize = unit * 2.6;

  const hasViolations = violations.length > 0;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-ink-2">
      <svg
        viewBox={viewBox}
        className="block aspect-[4/3] w-full"
        role="img"
        aria-label={`Generated floor plan — ${graph.rooms.length} rooms, ${graph.level}`}
      >
        {/* Drafting grid backdrop. */}
        <defs>
          <pattern
            id="plan-grid"
            width={MM_PER_FT * 4}
            height={MM_PER_FT * 4}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${MM_PER_FT * 4} 0 L 0 0 0 ${MM_PER_FT * 4}`}
              fill="none"
              stroke="#2c281f"
              strokeWidth={unit * 0.3}
            />
          </pattern>
        </defs>
        <rect
          x={-padLeft}
          y={-padTop}
          width={vbW}
          height={vbH}
          fill="#100e0b"
        />
        <rect
          x={-padLeft}
          y={-padTop}
          width={vbW}
          height={vbH}
          fill="url(#plan-grid)"
        />

        {/* Room polygons — fill + zone-tinted, violations outlined red. */}
        {graph.rooms.map((room) => {
          const flagged = violationsByRoom.has(room.id);
          return (
            <polygon
              key={room.id}
              points={room.polygon.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={ZONE_FILL[room.zone]}
              stroke={flagged ? VIOLATION_COLOR : "none"}
              strokeWidth={flagged ? interiorStroke * 1.4 : 0}
              strokeDasharray={
                room.zone === "outdoor" ? `${unit * 2} ${unit * 1.5}` : undefined
              }
            />
          );
        })}

        {/* Walls — exterior heavier than interior. */}
        {graph.walls.map((w) => (
          <line
            key={w.id}
            x1={w.start.x}
            y1={w.start.y}
            x2={w.end.x}
            y2={w.end.y}
            stroke={w.kind === "exterior" ? WALL_EXTERIOR : WALL_INTERIOR}
            strokeWidth={w.kind === "exterior" ? exteriorStroke : interiorStroke}
            strokeLinecap="square"
          />
        ))}

        {/* Openings — doors as swing arcs, windows as double strokes. */}
        {graph.openings.map((op) => {
          const wall = wallById.get(op.wallId);
          if (!wall) return null;
          return (
            <OpeningGlyph
              key={op.id}
              opening={op}
              wall={wall}
              unit={unit}
            />
          );
        })}

        {/* Room labels — name, room dimensions and square footage. */}
        {graph.rooms.map((room) => {
          const c = centroid(room.polygon);
          const { w, h } = bbox(room.polygon);
          // Hide labels in rooms too small to hold legible text.
          if (w < labelSize * 4 || h < labelSize * 2.4) return null;
          const flagged = violationsByRoom.has(room.id);
          // Room clear dimensions, read straight off the polygon's extents.
          const dims = `${formatFeetInches(w)} × ${formatFeetInches(h)}`;
          // Only show the dimension line when the room is tall enough for the
          // extra row to stay legible.
          const showDims = h > labelSize * 3.4;
          return (
            <g key={`label-${room.id}`}>
              <text
                x={c.x}
                y={showDims ? c.y - areaSize * 1.1 : c.y - areaSize * 0.55}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={labelSize}
                fill={flagged ? VIOLATION_COLOR : ZONE_TEXT[room.zone]}
                style={{ fontWeight: 500 }}
              >
                {room.label}
              </text>
              {showDims && (
                <text
                  x={c.x}
                  y={c.y + areaSize * 0.1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={areaSize}
                  fill="#9a8f7b"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {dims}
                </text>
              )}
              <text
                x={c.x}
                y={showDims ? c.y + areaSize * 1.25 : c.y + areaSize * 0.9}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={areaSize}
                fill="#79705f"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {Math.round(room.areaSqft)} ft²
              </text>
            </g>
          );
        })}

        {/* Footprint outline drawn last so it sits crisp above everything. */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="none"
          stroke={WALL_EXTERIOR}
          strokeWidth={exteriorStroke}
        />

        {/* CAD-grade annotation layer: overall dimensions, scale bar, north
            arrow — every number read straight off the geometry. */}
        <DraftingOverlay width={width} height={height} unit={unit} />
      </svg>

      {/* Legend + level chip. */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[10px] text-muted backdrop-blur">
        {graph.level}
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[10px] tabular-nums text-muted-2 backdrop-blur">
        {formatFeetInches(width)} × {formatFeetInches(height)} · {graph.roof} roof
      </div>
      {hasViolations && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-[#e0654b]/40 bg-[#e0654b]/15 px-2.5 py-1 text-[10px] font-medium text-[#f0917c] backdrop-blur">
          {violations.length} code{" "}
          {violations.length === 1 ? "issue" : "issues"}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Opening glyphs                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Draw a single opening on its host wall: doors render as a leaf line plus a
 * 90° swing arc; windows render as a double stroke across the wall gap.
 */
function OpeningGlyph({
  opening,
  wall,
  unit,
}: {
  opening: Opening;
  wall: Wall;
  unit: number;
}) {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return null;

  // Unit direction along the wall and unit normal perpendicular to it.
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const offset = Math.min(Math.max(opening.offsetMm, 0), len - opening.widthMm);
  const sx = wall.start.x + ux * offset;
  const sy = wall.start.y + uy * offset;
  const ex = sx + ux * opening.widthMm;
  const ey = sy + uy * opening.widthMm;

  if (opening.kind === "window") {
    // Double stroke: two thin lines straddling the wall centreline.
    const t = unit * 0.7;
    return (
      <g>
        <line
          x1={sx + nx * t}
          y1={sy + ny * t}
          x2={ex + nx * t}
          y2={ey + ny * t}
          stroke={OPENING_COLOR}
          strokeWidth={unit * 0.5}
        />
        <line
          x1={sx - nx * t}
          y1={sy - ny * t}
          x2={ex - nx * t}
          y2={ey - ny * t}
          stroke={OPENING_COLOR}
          strokeWidth={unit * 0.5}
        />
      </g>
    );
  }

  // door / cased-opening / garage-door — clear the wall gap, then draw a leaf.
  const swingSign = opening.swing === "left" ? -1 : 1;
  // Hinge at the start end; the leaf swings 90° off the wall.
  const hx = sx;
  const hy = sy;
  // Leaf tip when fully open (perpendicular to the wall).
  const lx = hx + nx * swingSign * opening.widthMm;
  const ly = hy + ny * swingSign * opening.widthMm;
  // Arc sweeps from the closed position (along the wall) to the open leaf.
  const sweep = swingSign > 0 ? 1 : 0;
  const arc = `M ${ex} ${ey} A ${opening.widthMm} ${opening.widthMm} 0 0 ${sweep} ${lx} ${ly}`;

  // Cased openings and garage doors have no swinging leaf — just clear the gap.
  const showLeaf = opening.kind === "door";

  return (
    <g>
      {/* Knock the wall gap out so the opening reads as a break. */}
      <line
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
        stroke="#100e0b"
        strokeWidth={unit * 2.2}
      />
      {showLeaf && (
        <>
          <line
            x1={hx}
            y1={hy}
            x2={lx}
            y2={ly}
            stroke={OPENING_COLOR}
            strokeWidth={unit * 0.55}
          />
          <path
            d={arc}
            fill="none"
            stroke={OPENING_COLOR}
            strokeWidth={unit * 0.4}
            strokeDasharray={`${unit} ${unit * 0.8}`}
          />
        </>
      )}
      {!showLeaf && (
        <line
          x1={sx}
          y1={sy}
          x2={ex}
          y2={ey}
          stroke={OPENING_COLOR}
          strokeWidth={unit * 0.6}
          strokeDasharray={`${unit * 1.4} ${unit}`}
        />
      )}
    </g>
  );
}
