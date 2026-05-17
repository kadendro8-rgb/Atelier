// Atelier v2.0 — floor-plan kernel types.
// The kernel works entirely in millimeters; UI layers convert for display.
// See docs/v2-spec.md §1.

export type Vec2 = { x: number; y: number };

export type RoomUse =
  | "great-room"
  | "kitchen"
  | "dining"
  | "primary-suite"
  | "bedroom"
  | "bathroom"
  | "laundry"
  | "mechanical"
  | "storage"
  | "garage"
  | "office"
  | "mudroom"
  | "hallway"
  | "foyer"
  | "porch"
  | "stair";

export type RoomZone = "public" | "private" | "service" | "outdoor";

export type Room = {
  id: string;
  label: string;
  use: RoomUse;
  zone: RoomZone;
  /** Closed polygon ring in mm. */
  polygon: Vec2[];
  /** Computed floor area, square feet. */
  areaSqft: number;
  ceilingMm: number;
  finishFloor: string;
};

export type WallKind = "exterior" | "interior" | "partition";

export type Wall = {
  id: string;
  kind: WallKind;
  start: Vec2;
  end: Vec2;
  thicknessMm: number;
};

export type OpeningKind = "door" | "window" | "cased-opening" | "garage-door";

export type Opening = {
  id: string;
  kind: OpeningKind;
  wallId: string;
  /** Distance along the wall from `start`, mm. */
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  /** Sill height for windows, mm. */
  sillMm?: number;
  swing?: "left" | "right";
};

export type RoofType = "gable" | "hip" | "shed" | "flat";

/** The graph produced by `generatePlan` and consumed by every other section. */
export type PlanGraph = {
  schemaVersion: 1;
  seed: number;
  level: string;
  /** Overall footprint extents in mm. */
  bounds: { width: number; height: number };
  rooms: Room[];
  walls: Wall[];
  openings: Opening[];
  roof: RoofType;
};

export type RoomRequirement = {
  use: RoomUse;
  count: number;
  minSqft: number;
  maxSqft: number;
};

export type AdjacencyRule = {
  a: RoomUse;
  b: RoomUse;
  relation: "adjacent" | "separated";
};

/**
 * Normalized brief consumed by the kernel. Section 1 will adapt the v1.1
 * `BriefParams` (see `lib/design.ts`) into this richer shape.
 */
export type ParsedBrief = {
  totalSqft: number;
  stories: number;
  rooms: RoomRequirement[];
  adjacencies: AdjacencyRule[];
  roof: RoofType;
  lotOrientation: "N" | "S" | "E" | "W";
};
