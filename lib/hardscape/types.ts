// Atelier — hardscape design kernel types.
//
// Hardscape is exterior site/concrete work: driveways, walkways, patios, pool
// decks, steps and decorative borders. This models a *site layout* — a set of
// free-standing exterior elements — not an enclosed building. The kernel works
// entirely in millimeters; UI layers convert for display.

/** A 2D point in the kernel's millimeter coordinate space. */
export type Vec2 = { x: number; y: number };

/** The kinds of exterior elements a hardscape plan can contain. */
export type HardscapeElementKind =
  | "driveway"
  | "walkway"
  | "patio"
  | "pool-deck"
  | "steps"
  | "border";

/**
 * Surface materials. Ordered loosely from least to most expensive — `cost.ts`
 * carries the per-square-foot figures, this union is just the vocabulary.
 */
export type HardscapeMaterial =
  | "broom-finish"
  | "stamped-concrete"
  | "exposed-aggregate"
  | "pavers"
  | "natural-stone";

/**
 * A single placed hardscape element: one closed polygon ring with a material,
 * a computed area and a human-readable label.
 */
export type HardscapeElement = {
  id: string;
  kind: HardscapeElementKind;
  material: HardscapeMaterial;
  /** Closed polygon ring in mm (first vertex is NOT repeated at the end). */
  polygon: Vec2[];
  /** Computed surface area, square feet. */
  areaSqft: number;
  label: string;
};

/**
 * Decorative options layered onto the plan. A banded border traces a contrast
 * ribbon around patios/pool-decks; a medallion inlay drops a feature panel at
 * a patio centre. These influence both geometry and cost.
 */
export type HardscapeDecor = {
  /** Add a contrast banded border around eligible elements. */
  bandedBorder: boolean;
  /** Material used for the banded border, if enabled. */
  borderMaterial?: HardscapeMaterial;
  /** Add a medallion inlay feature at the largest patio. */
  medallionInlay: boolean;
};

/** A single element the client has asked for, with a target size. */
export type HardscapeElementRequest = {
  kind: HardscapeElementKind;
  /** Surface material for this element. */
  material: HardscapeMaterial;
  /**
   * Target surface area in square feet. The generator sizes the element's
   * default parametric shape toward this value; omit to use a sensible
   * per-kind default.
   */
  targetSqft?: number;
};

/**
 * The structured input to `generateHardscape`: which elements the client
 * wants, their materials/sizes, and any decorative options.
 */
export type HardscapeBrief = {
  schemaVersion: 1;
  elements: HardscapeElementRequest[];
  decor: HardscapeDecor;
};

/** The deterministic output of `generateHardscape`. */
export type HardscapePlan = {
  schemaVersion: 1;
  seed: number;
  elements: HardscapeElement[];
  /** Sum of every element's area, square feet. */
  totalAreaSqft: number;
  /** Overall site extents in mm. */
  bounds: { width: number; height: number };
};
