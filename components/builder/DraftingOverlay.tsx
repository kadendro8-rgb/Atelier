"use client";

/**
 * DraftingOverlay — the CAD-grade annotation layer shared by the dimensioned
 * plan/layout sheets (`PlanCanvas`, `HardscapeLayoutSVG`).
 *
 * It draws, in the SVG's millimetre user space, the marks that separate a real
 * construction drawing from a sketch:
 *
 *  - overall extent **dimension lines** along the bottom and left edges, with
 *    architectural feet-inches text read straight off the geometry;
 *  - a **scale bar** with a tidy snapped interval;
 *  - a compact **north arrow**.
 *
 * Every number is derived from the passed extents — nothing is fudged. The
 * caller supplies a `unit` (a span-derived line/text weight) so the overlay
 * reads the same at any plan size, matching the host component's styling.
 */

import { chooseScaleBar, formatFeetInches } from "@/lib/drafting";

/* -------------------------------------------------------------------------- */
/* Shared drafting palette — muted on the dark sheet                          */
/* -------------------------------------------------------------------------- */

const DIM_LINE = "#6f6757";
const DIM_TEXT = "#b8ad99";
const ANNO_FILL = "#100e0b";

interface DraftingOverlayProps {
  /** Footprint / site width in mm (kernel units). */
  width: number;
  /** Footprint / site height in mm (kernel units). */
  height: number;
  /** Span-derived weight unit from the host SVG, so weights stay consistent. */
  unit: number;
  /**
   * Whether the y-axis grows downward (true for these top-left-origin plans).
   * Affects only the north arrow's sense.
   */
  yDown?: boolean;
}

/**
 * Render the dimension lines, scale bar and north arrow for a `width × height`
 * mm plan, positioned just outside the footprint.
 */
export function DraftingOverlay({
  width,
  height,
  unit,
}: DraftingOverlayProps) {
  // Weights and offsets, all derived from `unit` so the overlay scales.
  const stroke = unit * 0.42;
  const tick = unit * 1.6;
  const textSize = unit * 2.5;
  const gap = unit * 4.5; // dimension line offset outside the footprint
  const ext = unit * 1.5; // extension-line overshoot

  return (
    <g aria-hidden="true">
      {/* --- Overall width dimension — along the bottom edge --------------- */}
      <ExtentDimension
        x1={0}
        y1={height}
        x2={width}
        y2={height}
        side="bottom"
        offset={gap}
        ext={ext}
        tick={tick}
        stroke={stroke}
        textSize={textSize}
        label={formatFeetInches(width)}
      />

      {/* --- Overall height dimension — along the left edge --------------- */}
      <ExtentDimension
        x1={0}
        y1={0}
        x2={0}
        y2={height}
        side="left"
        offset={gap}
        ext={ext}
        tick={tick}
        stroke={stroke}
        textSize={textSize}
        label={formatFeetInches(height)}
      />

      {/* --- Scale bar — bottom-left, just below the width dimension ------ */}
      <ScaleBar
        spanMm={Math.max(width, height)}
        originX={0}
        originY={height + gap * 1.9}
        unit={unit}
        stroke={stroke}
        textSize={textSize}
      />

      {/* --- North arrow — top-right, outside the footprint -------------- */}
      <NorthArrow
        cx={width + gap * 0.55}
        cy={-gap * 0.55}
        r={unit * 3.2}
        stroke={stroke}
        textSize={textSize}
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Extent dimension line                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A single overall-extent dimension: an offset dimension line with end ticks,
 * extension lines back to the footprint, and a centred feet-inches label.
 */
function ExtentDimension({
  x1,
  y1,
  x2,
  y2,
  side,
  offset,
  ext,
  tick,
  stroke,
  textSize,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  side: "bottom" | "left";
  offset: number;
  ext: number;
  tick: number;
  stroke: number;
  textSize: number;
  label: string;
}) {
  const horizontal = side === "bottom";
  // Push the dimension line `offset` away from the footprint edge.
  const dx = horizontal ? 0 : -offset;
  const dy = horizontal ? offset : 0;
  const ax = x1 + dx;
  const ay = y1 + dy;
  const bx = x2 + dx;
  const by = y2 + dy;
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;

  return (
    <g>
      {/* Extension lines — from each footprint corner out past the dim line. */}
      <line
        x1={x1}
        y1={y1}
        x2={horizontal ? x1 : x1 - offset - ext}
        y2={horizontal ? y1 + offset + ext : y1}
        stroke={DIM_LINE}
        strokeWidth={stroke}
      />
      <line
        x1={x2}
        y1={y2}
        x2={horizontal ? x2 : x2 - offset - ext}
        y2={horizontal ? y2 + offset + ext : y2}
        stroke={DIM_LINE}
        strokeWidth={stroke}
      />

      {/* The dimension line itself. */}
      <line
        x1={ax}
        y1={ay}
        x2={bx}
        y2={by}
        stroke={DIM_LINE}
        strokeWidth={stroke}
      />

      {/* 45° architectural end ticks. */}
      <EndTick x={ax} y={ay} size={tick} stroke={stroke} />
      <EndTick x={bx} y={by} size={tick} stroke={stroke} />

      {/* Centred label, on a knocked-out chip so it reads over the line. */}
      <g
        transform={
          horizontal
            ? undefined
            : `rotate(-90 ${midX - textSize * 0.9} ${midY})`
        }
      >
        <rect
          x={(horizontal ? midX : midX - textSize * 0.9) - label.length * textSize * 0.32}
          y={(horizontal ? midY : midY) - textSize * 0.72}
          width={label.length * textSize * 0.64}
          height={textSize * 1.44}
          fill={ANNO_FILL}
          opacity={0.92}
          rx={textSize * 0.2}
        />
        <text
          x={horizontal ? midX : midX - textSize * 0.9}
          y={midY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={textSize}
          fill={DIM_TEXT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {label}
        </text>
      </g>
    </g>
  );
}

/** A 45° architectural slash tick centred on `(x, y)`. */
function EndTick({
  x,
  y,
  size,
  stroke,
}: {
  x: number;
  y: number;
  size: number;
  stroke: number;
}) {
  return (
    <line
      x1={x - size}
      y1={y - size}
      x2={x + size}
      y2={y + size}
      stroke={DIM_LINE}
      strokeWidth={stroke}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Scale bar                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A divided scale bar: four alternating filled/open segments of a tidy snapped
 * interval, with `0` and the full-run label called out.
 */
function ScaleBar({
  spanMm,
  originX,
  originY,
  unit,
  stroke,
  textSize,
}: {
  spanMm: number;
  originX: number;
  originY: number;
  unit: number;
  stroke: number;
  textSize: number;
}) {
  const step = chooseScaleBar(spanMm);
  const segMm = step.mm / 2; // two divisions per labelled half
  const segments = 4;
  const barH = unit * 1.3;

  return (
    <g>
      {Array.from({ length: segments }, (_, i) => (
        <rect
          key={i}
          x={originX + segMm * i}
          y={originY}
          width={segMm}
          height={barH}
          fill={i % 2 === 0 ? DIM_LINE : ANNO_FILL}
          stroke={DIM_LINE}
          strokeWidth={stroke}
        />
      ))}
      <text
        x={originX}
        y={originY + barH + textSize * 1.5}
        textAnchor="middle"
        fontSize={textSize}
        fill={DIM_TEXT}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        0
      </text>
      <text
        x={originX + segMm * segments}
        y={originY + barH + textSize * 1.5}
        textAnchor="middle"
        fontSize={textSize}
        fill={DIM_TEXT}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {step.label}
      </text>
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* North arrow                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A compact north arrow — a slim filled needle pointing up (plan north) with a
 * paired open south half and an `N` callout. Plan north is taken as up, the
 * standard drafting convention.
 */
function NorthArrow({
  cx,
  cy,
  r,
  stroke,
  textSize,
}: {
  cx: number;
  cy: number;
  r: number;
  stroke: number;
  textSize: number;
}) {
  const wing = r * 0.34;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={ANNO_FILL}
        opacity={0.9}
        stroke={DIM_LINE}
        strokeWidth={stroke}
      />
      {/* North half — filled solid. */}
      <path
        d={`M ${cx} ${cy - r * 0.66} L ${cx + wing} ${cy} L ${cx - wing} ${cy} Z`}
        fill={DIM_TEXT}
      />
      {/* South half — open, drawn from the same waist point downward. */}
      <path
        d={`M ${cx} ${cy + r * 0.5} L ${cx + wing} ${cy} L ${cx - wing} ${cy} Z`}
        fill="none"
        stroke={DIM_LINE}
        strokeWidth={stroke}
      />
      <text
        x={cx}
        y={cy - r * 0.78}
        textAnchor="middle"
        dominantBaseline="text-after-edge"
        fontSize={textSize * 0.95}
        fill={DIM_TEXT}
        style={{ fontWeight: 600 }}
      >
        N
      </text>
    </g>
  );
}
