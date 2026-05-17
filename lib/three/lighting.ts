// Atelier W4 — parametric time-of-day sun model for the 3D viewport.
//
// A simple parametric arc, not a real solar ephemeris: the sun rises in the
// east, peaks at solar noon, and sets in the west, with intensity and color
// temperature warming toward the horizon for golden-hour reads.
//
// DECISION: full SunCalc lat/lng precision is out of CORE scope — this arc is
// deliberately approximate but produces convincing day/golden/dusk lighting.
// TODO(v2): real SunCalc geolocation tied to the sited lot.

import { Color } from "three";

/** Sunrise / sunset hours that bound the day arc (24h clock). */
export const SUN_DAY_START = 5;
export const SUN_DAY_END = 21;

/** Clamp a value into the inclusive `[min, max]` range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation between `a` and `b` by `t` in `[0, 1]`. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** A fully-resolved sun state for a given hour of day. */
export type SunState = {
  /** World-space directional-light position (sun direction × radius). */
  position: [number, number, number];
  /** Directional light intensity. */
  intensity: number;
  /** Light color (warm at the horizon, neutral at noon). */
  color: Color;
  /** Ambient-fill intensity that tracks daylight level. */
  ambientIntensity: number;
  /** Hemisphere-light intensity that tracks daylight level. */
  hemiIntensity: number;
  /** 0 (night) … 1 (full daylight) — useful for sky / fill blends. */
  daylight: number;
};

// Warm golden-hour and neutral-noon light colors.
const GOLDEN = new Color("#ffae5e");
const NOON = new Color("#fff6e8");

/**
 * Resolve the sun for a given `hour` (24h clock), positioning the directional
 * light on an arc of the given `radius`.
 *
 * - `dayFraction` 0 at sunrise → 1 at sunset; elevation follows a sine arc.
 * - Azimuth sweeps from due east (−X) through south to due west (+X).
 * - Intensity/color warm as the sun nears either horizon.
 */
export function computeSun(hour: number, radius: number): SunState {
  const h = clamp(hour, SUN_DAY_START, SUN_DAY_END);
  const dayFraction = (h - SUN_DAY_START) / (SUN_DAY_END - SUN_DAY_START);

  // Elevation: 0 at the horizons, peaking at solar noon (sin arc).
  const elevation = Math.sin(dayFraction * Math.PI); // 0 … 1 … 0
  // Azimuth: east → west sweep, biased toward the south for a key-light read.
  const azimuth = lerp(-Math.PI * 0.55, Math.PI * 0.55, dayFraction);

  // Spherical → cartesian. Y is up; the sun stays slightly above the horizon
  // even at the day's ends so the model never goes fully unlit.
  const heightArc = lerp(0.12, 1.0, elevation);
  const x = Math.sin(azimuth) * radius;
  const y = heightArc * radius;
  const z = Math.cos(azimuth) * radius * 0.55 + radius * 0.25;

  // `horizonness` is 1 at the horizons, 0 at noon — drives warmth + dimming.
  const horizonness = 1 - elevation;
  const color = NOON.clone().lerp(GOLDEN, Math.pow(horizonness, 1.4));

  // Daylight level: bright midday, dim at the ends but never pitch black.
  const daylight = lerp(0.25, 1, elevation);

  return {
    position: [x, y, z],
    intensity: lerp(1.4, 3.1, elevation),
    color,
    ambientIntensity: lerp(0.32, 0.6, daylight),
    hemiIntensity: lerp(0.25, 0.55, daylight),
    daylight,
  };
}

/** Format an hour (e.g. 13.5) as a friendly 12h label like "1:30 PM". */
export function formatHour(hour: number): string {
  const whole = Math.floor(hour);
  const minutes = Math.round((hour - whole) * 60);
  const period = whole >= 12 ? "PM" : "AM";
  const h12 = whole % 12 === 0 ? 12 : whole % 12;
  const mm = minutes.toString().padStart(2, "0");
  return `${h12}:${mm} ${period}`;
}
