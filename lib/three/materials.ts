// Atelier W4 — physically-based material presets for the 3D viewport.
//
// Step 1 of the hybrid render pipeline: the viewport must emit a *credible*
// base image that a later AI img2img pass photo-finishes. These presets give
// each surface type (wall / floor / roof) a small, named set of plausible
// real-world materials with sensible PBR parameters.
//
// Units: `color` is a hex string, `roughness`/`metalness` are 0..1, and
// `envMapIntensity` scales the contribution of the image-based lighting.
//
// TODO(v2): replace with the 30-preset material editor + assets/materials.json
// (textured albedo/normal/roughness maps instead of flat parameters).

import type { RoofType } from "@/lib/kernel/types";

/** PBR parameters for a single `meshStandardMaterial`. */
export type PbrPreset = {
  /** Human-readable preset name, shown in any future material picker. */
  label: string;
  /** Base/albedo color as a hex string. */
  color: string;
  /** Micro-surface roughness, 0 (mirror) … 1 (fully diffuse). */
  roughness: number;
  /** Metalness, 0 (dielectric) … 1 (conductor). */
  metalness: number;
  /** How strongly the environment map lights this surface. */
  envMapIntensity: number;
};

/** The three surface categories `buildScene` tags meshes with. */
export type SurfaceType = "wall" | "floor" | "roof";

/* -------------------------------------------------------------------------- */
/* Wall presets                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Exterior wall finishes. Painted plaster is the neutral default; the others
 * give the later AI pass a recognizable surface cue to lock onto.
 */
export const WALL_PRESETS = {
  "painted-plaster": {
    label: "Painted plaster",
    color: "#e9e4d9",
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.7,
  },
  "board-and-batten": {
    label: "Board & batten",
    color: "#d8d3c6",
    roughness: 0.78,
    metalness: 0.0,
    envMapIntensity: 0.65,
  },
  brick: {
    label: "Brick",
    color: "#9c5a44",
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.55,
  },
} as const satisfies Record<string, PbrPreset>;

export type WallPresetId = keyof typeof WALL_PRESETS;

/* -------------------------------------------------------------------------- */
/* Floor / slab presets                                                       */
/* -------------------------------------------------------------------------- */

/** Floor-slab finishes. Poured concrete is the realistic massing default. */
export const FLOOR_PRESETS = {
  concrete: {
    label: "Poured concrete",
    color: "#8d8980",
    roughness: 0.82,
    metalness: 0.04,
    envMapIntensity: 0.6,
  },
  "polished-concrete": {
    label: "Polished concrete",
    color: "#9a968d",
    roughness: 0.38,
    metalness: 0.06,
    envMapIntensity: 1.0,
  },
} as const satisfies Record<string, PbrPreset>;

export type FloorPresetId = keyof typeof FLOOR_PRESETS;

/* -------------------------------------------------------------------------- */
/* Roof presets                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Roof finishes. Asphalt shingle reads well on pitched roofs; standing-seam
 * metal suits low/shed/flat profiles and gives a crisp specular highlight.
 */
export const ROOF_PRESETS = {
  "asphalt-shingle": {
    label: "Asphalt shingle",
    color: "#3a3733",
    roughness: 0.88,
    metalness: 0.0,
    envMapIntensity: 0.5,
  },
  "standing-seam-metal": {
    label: "Standing-seam metal",
    color: "#4a4d50",
    roughness: 0.42,
    metalness: 0.75,
    envMapIntensity: 1.1,
  },
} as const satisfies Record<string, PbrPreset>;

export type RoofPresetId = keyof typeof ROOF_PRESETS;

/* -------------------------------------------------------------------------- */
/* Defaults                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The active material per surface type. Defaults pick a neutral wall, a
 * concrete slab, and a roof finish that suits the plan's `roof` archetype:
 * flat/shed roofs default to standing-seam metal, pitched roofs to shingle.
 */
export type SurfaceMaterials = {
  wall: PbrPreset;
  floor: PbrPreset;
  roof: PbrPreset;
};

/** Resolve a sensible default material set for a given roof archetype. */
export function defaultMaterials(roof: RoofType): SurfaceMaterials {
  // DECISION: low-slope roofs (flat/shed) read more credibly as standing-seam
  // metal; gable/hip pitched roofs default to asphalt shingle.
  const roofPreset: PbrPreset =
    roof === "flat" || roof === "shed"
      ? ROOF_PRESETS["standing-seam-metal"]
      : ROOF_PRESETS["asphalt-shingle"];

  return {
    wall: WALL_PRESETS["painted-plaster"],
    floor: FLOOR_PRESETS.concrete,
    roof: roofPreset,
  };
}
