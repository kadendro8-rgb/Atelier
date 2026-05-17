/**
 * Builder-layer glue for the hardscape design kernel.
 *
 * The kernel in this folder (`generate.ts`, `cost.ts`, `types.ts`) is pure and
 * UI-agnostic. This module is the thin, client-side seam between that kernel
 * and the `/builder` flow: display metadata for the brief builder, keyless
 * localStorage persistence for the brief and the generated plan, and the
 * project-type read shared with the home flow.
 *
 * Everything here is keyless and reload-safe — every storage read/write is
 * wrapped so a disabled / private-mode store never breaks the builder.
 */
import { PROJECT_TYPES } from "@/lib/project-types";
import type { ProjectType } from "@/lib/db/types";
import type {
  HardscapeBrief,
  HardscapeElementKind,
  HardscapeElementRequest,
  HardscapeMaterial,
  HardscapePlan,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Project-type read (shared key with the lot step)                           */
/* -------------------------------------------------------------------------- */

/** localStorage key the lot step persists the chosen project type under. */
export const PROJECT_TYPE_KEY = "atelier:projectType";

/** Narrow an arbitrary string to a known, registered `ProjectType`. */
export function isProjectType(value: string): value is ProjectType {
  return PROJECT_TYPES.some((t) => t.id === value);
}

/**
 * Resolve the active project type for a builder step. A `?type=` query value
 * (handed from the marketing hero) wins; otherwise the persisted lot-step
 * choice is used; otherwise `home`. Safe to call client-side only.
 */
export function resolveProjectType(queryType?: string | null): ProjectType {
  if (queryType && isProjectType(queryType)) {
    const info = PROJECT_TYPES.find((t) => t.id === queryType);
    if (info?.available) return queryType;
  }
  try {
    const stored = window.localStorage.getItem(PROJECT_TYPE_KEY);
    if (stored && isProjectType(stored)) return stored;
  } catch {
    // Storage unavailable — fall through to the default.
  }
  return "home";
}

/* -------------------------------------------------------------------------- */
/* Display metadata for the brief builder                                     */
/* -------------------------------------------------------------------------- */

/** One element kind, with the copy the brief builder shows. */
export interface ElementKindInfo {
  kind: HardscapeElementKind;
  label: string;
  /** One-line description shown under the label. */
  description: string;
  /** Sensible default target size in sq ft for a freshly added element. */
  defaultSqft: number;
  /** Inclusive size range the size slider allows, sq ft. */
  minSqft: number;
  maxSqft: number;
}

/** Every hardscape element kind, in the order the brief builder lists them. */
export const ELEMENT_KINDS: readonly ElementKindInfo[] = [
  {
    kind: "patio",
    label: "Patio",
    description: "An outdoor room off the house.",
    defaultSqft: 320,
    minSqft: 80,
    maxSqft: 900,
  },
  {
    kind: "walkway",
    label: "Walkway",
    description: "A path connecting drive, door, and yard.",
    defaultSqft: 120,
    minSqft: 40,
    maxSqft: 400,
  },
  {
    kind: "driveway",
    label: "Driveway",
    description: "Vehicle approach and parking apron.",
    defaultSqft: 600,
    minSqft: 200,
    maxSqft: 1600,
  },
  {
    kind: "pool-deck",
    label: "Pool Deck",
    description: "A broad apron wrapping a pool.",
    defaultSqft: 480,
    minSqft: 150,
    maxSqft: 1200,
  },
  {
    kind: "steps",
    label: "Steps",
    description: "A run of steps between grades.",
    defaultSqft: 48,
    minSqft: 16,
    maxSqft: 160,
  },
  {
    kind: "border",
    label: "Border",
    description: "A decorative ribbon edging a surface.",
    defaultSqft: 60,
    minSqft: 20,
    maxSqft: 240,
  },
] as const;

/** One surface material, with builder copy and a swatch colour. */
export interface MaterialInfo {
  material: HardscapeMaterial;
  label: string;
  /** Short price-tier note shown alongside the label. */
  note: string;
  /** SVG/legend fill colour for this material — warm, on-theme. */
  swatch: string;
}

/**
 * Every surface material, ordered least → most expensive. Swatch colours are
 * tuned for the dark theme and reused by the layout SVG legend.
 */
export const MATERIALS: readonly MaterialInfo[] = [
  {
    material: "broom-finish",
    label: "Broom-Finish Concrete",
    note: "Workhorse slab",
    swatch: "#8a8170",
  },
  {
    material: "stamped-concrete",
    label: "Stamped Concrete",
    note: "Patterned & colored",
    swatch: "#b97f4e",
  },
  {
    material: "exposed-aggregate",
    label: "Exposed Aggregate",
    note: "Washed finish",
    swatch: "#a8946d",
  },
  {
    material: "pavers",
    label: "Interlocking Pavers",
    note: "Modular units",
    swatch: "#d28a55",
  },
  {
    material: "natural-stone",
    label: "Natural Stone",
    note: "Flagstone / bluestone",
    swatch: "#8fa183",
  },
] as const;

/** Look up a material's display metadata; falls back to broom-finish. */
export function materialInfo(material: HardscapeMaterial): MaterialInfo {
  return MATERIALS.find((m) => m.material === material) ?? MATERIALS[0];
}

/** Look up an element kind's display metadata; falls back to patio. */
export function kindInfo(kind: HardscapeElementKind): ElementKindInfo {
  return ELEMENT_KINDS.find((k) => k.kind === kind) ?? ELEMENT_KINDS[0];
}

/* -------------------------------------------------------------------------- */
/* Default brief                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A sensible starter brief — a stamped-concrete patio plus a walkway. Gives a
 * fresh visitor a real, generatable layout the moment they land on the step.
 */
export function defaultHardscapeBrief(): HardscapeBrief {
  return {
    schemaVersion: 1,
    elements: [
      { kind: "patio", material: "stamped-concrete", targetSqft: 320 },
      { kind: "walkway", material: "pavers", targetSqft: 120 },
    ],
    decor: {
      bandedBorder: true,
      borderMaterial: "natural-stone",
      medallionInlay: false,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

const KINDS = new Set<string>(ELEMENT_KINDS.map((k) => k.kind));
const MATS = new Set<string>(MATERIALS.map((m) => m.material));

/** Runtime shape guard for a single element request from stored JSON. */
function isElementRequest(value: unknown): value is HardscapeElementRequest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.kind !== "string" || !KINDS.has(v.kind)) return false;
  if (typeof v.material !== "string" || !MATS.has(v.material)) return false;
  if (
    v.targetSqft !== undefined &&
    (typeof v.targetSqft !== "number" || !Number.isFinite(v.targetSqft))
  ) {
    return false;
  }
  return true;
}

/** Runtime shape guard for a restored `HardscapeBrief`. */
export function isHardscapeBrief(value: unknown): value is HardscapeBrief {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== 1) return false;
  if (!Array.isArray(v.elements) || !v.elements.every(isElementRequest)) {
    return false;
  }
  const decor = v.decor;
  if (typeof decor !== "object" || decor === null) return false;
  const d = decor as Record<string, unknown>;
  if (typeof d.bandedBorder !== "boolean") return false;
  if (typeof d.medallionInlay !== "boolean") return false;
  if (
    d.borderMaterial !== undefined &&
    (typeof d.borderMaterial !== "string" || !MATS.has(d.borderMaterial))
  ) {
    return false;
  }
  return true;
}

/** Runtime shape guard for a restored `HardscapePlan`. */
export function isHardscapePlan(value: unknown): value is HardscapePlan {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== 1) return false;
  if (!Array.isArray(v.elements)) return false;
  if (typeof v.totalAreaSqft !== "number") return false;
  const bounds = v.bounds;
  if (typeof bounds !== "object" || bounds === null) return false;
  const b = bounds as Record<string, unknown>;
  return typeof b.width === "number" && typeof b.height === "number";
}

/* -------------------------------------------------------------------------- */
/* Keyless persistence                                                        */
/* -------------------------------------------------------------------------- */

/** localStorage key for the cached hardscape brief. */
export const HARDSCAPE_BRIEF_KEY = "atelier:hardscape:brief";

/** localStorage key for the cached hardscape plan (per project). */
export const hardscapePlanKey = (projectId: string | null) =>
  `atelier:hardscape:plan:${projectId ?? "local"}`;

/** Persist the working brief. Best-effort — never throws. */
export function saveHardscapeBrief(brief: HardscapeBrief): void {
  try {
    window.localStorage.setItem(HARDSCAPE_BRIEF_KEY, JSON.stringify(brief));
  } catch {
    // Storage unavailable / over quota — the in-memory brief still threads on.
  }
}

/** Restore a cached brief, or null when none is stored / it is corrupt. */
export function loadHardscapeBrief(): HardscapeBrief | null {
  try {
    const raw = window.localStorage.getItem(HARDSCAPE_BRIEF_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isHardscapeBrief(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist a generated plan for a project. Best-effort — never throws. */
export function saveHardscapePlan(
  projectId: string | null,
  plan: HardscapePlan,
): void {
  try {
    window.localStorage.setItem(
      hardscapePlanKey(projectId),
      JSON.stringify(plan),
    );
  } catch {
    // Storage unavailable / over quota — the plan re-generates deterministically.
  }
}

/** Restore a cached plan for a project, or null when none / corrupt. */
export function loadHardscapePlan(
  projectId: string | null,
): HardscapePlan | null {
  try {
    const raw = window.localStorage.getItem(hardscapePlanKey(projectId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isHardscapePlan(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Cost formatting                                                            */
/* -------------------------------------------------------------------------- */

/** Format a whole-cent figure as a rounded USD string, e.g. `$12,400`. */
export function formatCents(cents: number): string {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString("en-US")}`;
}
