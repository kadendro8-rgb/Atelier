/**
 * Drafting helpers — shared formatting for the dimensioned plan/layout sheets.
 *
 * The geometry kernels (home + hardscape) work entirely in millimetres. These
 * pure functions convert kernel millimetres into the architectural feet-inches
 * conventions a contractor reads, and pick a tidy scale-bar interval. They are
 * deliberately framework-free so the SVG components — `PlanCanvas` and
 * `HardscapeLayoutSVG` — can share one honest source of truth for every
 * displayed number.
 */

/** Millimetres in one foot — the single conversion constant. */
export const MM_PER_FT = 304.8;
/** Millimetres in one inch. */
export const MM_PER_IN = 25.4;

/**
 * Format a millimetre length as an architectural feet-inches string, e.g.
 * `12'-6"`. Inches are rounded to the nearest whole inch; a 12" carry rolls up
 * into the feet. A sub-foot length renders as inches only (`9"`).
 */
export function formatFeetInches(mm: number): string {
  const totalInches = Math.round(mm / MM_PER_IN);
  let feet = Math.floor(totalInches / 12);
  let inches = totalInches - feet * 12;
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  if (feet === 0) return `${inches}"`;
  if (inches === 0) return `${feet}'-0"`;
  return `${feet}'-${inches}"`;
}

/** Format a millimetre length as a rounded decimal-feet string, e.g. `12.5′`. */
export function formatFeet(mm: number, decimals = 0): string {
  return `${(mm / MM_PER_FT).toFixed(decimals)}′`;
}

/** A chosen scale-bar segment: its real length in mm and its printed label. */
export interface ScaleBarStep {
  /** One segment's real-world length, in millimetres. */
  mm: number;
  /** Human label for the whole bar's run, e.g. `10 ft`. */
  label: string;
}

/**
 * Pick a tidy scale-bar interval for a drawing whose visible span is
 * `spanMm` millimetres wide. Targets a bar roughly a fifth of the span, snapped
 * to a friendly foot value (1, 2, 5, 10, 20, 50, …) so the bar reads cleanly.
 */
export function chooseScaleBar(spanMm: number): ScaleBarStep {
  const targetFt = spanMm / MM_PER_FT / 5;
  // Snap the target to a 1-2-5 sequence across decades.
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(targetFt, 1))));
  const candidates = [1, 2, 5, 10].map((m) => m * pow);
  let ft = candidates[0];
  for (const c of candidates) {
    if (c <= targetFt) ft = c;
  }
  return { mm: ft * MM_PER_FT, label: `${ft} ft` };
}
