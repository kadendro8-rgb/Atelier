"use client";

/**
 * Read-only SVG renderer for a generated `HardscapePlan`.
 *
 * Draws each hardscape element's polygon (mm units, scaled to fit) filled by
 * its material's swatch colour, with a centred label and area. The site
 * extents come from `plan.bounds`; the SVG `viewBox` is padded so strokes and
 * labels are never clipped. Mirrors the CAD-grade dark-theme styling of
 * `PlanCanvas`, but for free-standing exterior elements rather than an
 * enclosed building.
 */
import { useMemo } from "react";
import { materialInfo } from "@/lib/hardscape/builder";
import type { HardscapeElement, HardscapePlan, Vec2 } from "@/lib/hardscape/types";

/** Axis-aligned bounding box of a polygon ring. */
function bbox(poly: Vec2[]): { minX: number; minY: number; w: number; h: number } {
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
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

/** Centroid of a closed polygon ring (vertex average). */
function centroid(poly: Vec2[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  return { x: x / poly.length, y: y / poly.length };
}

const MM_PER_FT = 304.8;
const GRID_MM = MM_PER_FT * 4; // 4-ft drafting grid

export function HardscapeLayoutSVG({ plan }: { plan: HardscapePlan }) {
  const { width, height } = plan.bounds;

  // Decorative elements (banded border, medallion) are layered on top of the
  // slabs they frame; draw the borders/medallions last so they read crisply.
  const ordered = useMemo(() => {
    const base = plan.elements.filter((e) => e.kind !== "border");
    const decor = plan.elements.filter((e) => e.kind === "border");
    return [...base, ...decor];
  }, [plan.elements]);

  // Padding so labels and strokes are not clipped at the site edges.
  const span = Math.max(width, height, MM_PER_FT);
  const pad = span * 0.07;
  const viewBox = `${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`;

  // Line/text weights derived from the site span so they read the same at any
  // plan size.
  const unit = span / 100;
  const strokeW = unit * 0.9;
  const labelSize = unit * 3.2;
  const areaSize = unit * 2.4;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-ink-2">
      <svg
        viewBox={viewBox}
        className="block aspect-[4/3] w-full"
        role="img"
        aria-label={`Generated hardscape site layout — ${plan.elements.length} elements`}
      >
        <defs>
          <pattern
            id="hardscape-grid"
            width={GRID_MM}
            height={GRID_MM}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${GRID_MM} 0 L 0 0 0 ${GRID_MM}`}
              fill="none"
              stroke="#2c281f"
              strokeWidth={unit * 0.3}
            />
          </pattern>
        </defs>

        <rect
          x={-pad}
          y={-pad}
          width={width + pad * 2}
          height={height + pad * 2}
          fill="#100e0b"
        />
        <rect
          x={-pad}
          y={-pad}
          width={width + pad * 2}
          height={height + pad * 2}
          fill="url(#hardscape-grid)"
        />

        {/* Element polygons — filled by material swatch. */}
        {ordered.map((el) => {
          const info = materialInfo(el.material);
          const isBorder = el.kind === "border";
          return (
            <polygon
              key={el.id}
              points={el.polygon.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={isBorder ? "none" : info.swatch}
              fillOpacity={isBorder ? undefined : 0.62}
              stroke={info.swatch}
              strokeWidth={isBorder ? strokeW * 1.6 : strokeW}
              strokeLinejoin="round"
            />
          );
        })}

        {/* Element labels + areas — skip rings too small to hold text. */}
        {ordered.map((el) => {
          if (el.kind === "border") return null;
          const c = centroid(el.polygon);
          const b = bbox(el.polygon);
          if (b.w < labelSize * 4 || b.h < labelSize * 2.4) return null;
          return (
            <g key={`label-${el.id}`}>
              <text
                x={c.x}
                y={c.y - areaSize * 0.6}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={labelSize}
                fill="#f1e9da"
                style={{ fontWeight: 500 }}
              >
                {el.label}
              </text>
              <text
                x={c.x}
                y={c.y + areaSize}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={areaSize}
                fill="#0b0a09"
                fillOpacity={0.7}
              >
                {Math.round(el.areaSqft)} ft²
              </text>
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[10px] text-muted backdrop-blur">
        Site layout
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-border bg-ink/80 px-2.5 py-1 text-[10px] text-muted-2 backdrop-blur">
        {Math.round(width / MM_PER_FT)}′ × {Math.round(height / MM_PER_FT)}′ site
      </div>
    </div>
  );
}

/** A compact legend mapping every material used in a plan to its swatch. */
export function HardscapeLegend({ plan }: { plan: HardscapePlan }) {
  const materials = useMemo(() => {
    const seen = new Map<string, HardscapeElement["material"]>();
    for (const el of plan.elements) seen.set(el.material, el.material);
    return [...seen.values()];
  }, [plan.elements]);

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {materials.map((m) => {
        const info = materialInfo(m);
        return (
          <li key={m} className="flex items-center gap-2 text-xs text-muted">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-sm border border-border-bright"
              style={{ backgroundColor: info.swatch }}
            />
            {info.label}
          </li>
        );
      })}
    </ul>
  );
}
