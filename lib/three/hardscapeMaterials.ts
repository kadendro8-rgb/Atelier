// Atelier — physically-based material presets for the hardscape 3D viewport.
//
// Companion to `lib/three/materials.ts` (the home viewport's wall/floor/roof
// presets): this maps every `HardscapeMaterial` in the vocabulary to a
// plausible PBR `meshStandardMaterial` parameter set, so an extruded slab
// reads convincingly as the surface the contractor actually chose.
//
// Units: `color` is a hex string, `roughness`/`metalness` are 0..1, and
// `envMapIntensity` scales the contribution of the image-based lighting. The
// `PbrPreset` shape is reused verbatim from `lib/three/materials.ts` so a
// future textured-map material editor can unify both surfaces.
//
// TODO(v2): textured albedo/normal/roughness maps per surface (stamped-pattern
// normal maps, aggregate speckle, paver joint lines) instead of flat params.

import type { PbrPreset } from "./materials";
import type { HardscapeMaterial } from "@/lib/hardscape/types";

export type { PbrPreset };

/**
 * One PBR preset per hardscape surface material.
 *
 * Colors are tuned warmer/lighter than the 2D legend swatches in
 * `lib/hardscape/builder.ts`: the legend swatches are picked for contrast on a
 * dark SVG, whereas these are albedo values lit by a daylight environment, so
 * they read as a real outdoor surface under the parametric sun.
 *
 * - broom-finish      — a matte poured-concrete workhorse slab.
 * - stamped-concrete  — patterned/colored concrete; warmer, slightly glossier.
 * - exposed-aggregate — washed finish; mid roughness, faint sparkle via env.
 * - pavers            — modular units; crisper specular, a touch less rough.
 * - natural-stone     — flagstone/bluestone; cool, matte, characterful.
 */
export const HARDSCAPE_PRESETS = {
  "broom-finish": {
    label: "Broom-Finish Concrete",
    color: "#b4ada0",
    roughness: 0.93,
    metalness: 0.02,
    envMapIntensity: 0.6,
  },
  "stamped-concrete": {
    label: "Stamped Concrete",
    color: "#b88a63",
    roughness: 0.78,
    metalness: 0.03,
    envMapIntensity: 0.72,
  },
  "exposed-aggregate": {
    label: "Exposed Aggregate",
    color: "#b6a888",
    roughness: 0.84,
    metalness: 0.05,
    envMapIntensity: 0.8,
  },
  pavers: {
    label: "Interlocking Pavers",
    color: "#c08a5f",
    roughness: 0.7,
    metalness: 0.04,
    envMapIntensity: 0.85,
  },
  "natural-stone": {
    label: "Natural Stone",
    color: "#8d9685",
    roughness: 0.88,
    metalness: 0.03,
    envMapIntensity: 0.7,
  },
} as const satisfies Record<HardscapeMaterial, PbrPreset>;

/** Resolve a PBR preset for a hardscape material; falls back to broom-finish. */
export function hardscapeMaterialPreset(
  material: HardscapeMaterial,
): PbrPreset {
  return HARDSCAPE_PRESETS[material] ?? HARDSCAPE_PRESETS["broom-finish"];
}
