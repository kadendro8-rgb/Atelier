/**
 * Typed registry of the building-market project types.
 *
 * Atelier started as a single-product app (custom home) and is broadening into
 * a multi-type building market. This registry is the single source of truth
 * for which types exist, how they read in the UI, and whether their design
 * module is built yet. Only `home` is `available` today; the rest are
 * placeholders until their design generators ship.
 */
import type { ProjectType } from "@/lib/db/types";

/** Display + availability metadata for one project type. */
export interface ProjectTypeInfo {
  /** The `projects.project_type` value. */
  id: ProjectType;
  /** Human-readable label for pickers and headings. */
  label: string;
  /** One-line description of what this type produces. */
  description: string;
  /** Whether the design module for this type is built and selectable. */
  available: boolean;
}

/**
 * Every project type, in display order. Keep in sync with the
 * `projects.project_type` check constraint and the `ProjectType` union.
 */
export const PROJECT_TYPES: readonly ProjectTypeInfo[] = [
  {
    id: "home",
    label: "Custom Home",
    description: "A full custom house designed from lot to plan set.",
    available: true,
  },
  {
    id: "hardscape",
    label: "Hardscape & Backyard",
    description: "Patios, decks, and outdoor living spaces in the backyard.",
    available: true,
  },
  {
    id: "room",
    label: "Room & Addition",
    description: "A new room or addition extending an existing structure.",
    available: false,
  },
  {
    id: "garage",
    label: "Garage",
    description: "A detached or attached garage and its access drive.",
    available: false,
  },
  {
    id: "gym",
    label: "Home Gym",
    description: "A dedicated fitness space, standalone or built-in.",
    available: false,
  },
] as const;

/** Lookup a project type's metadata by id. */
export function getProjectTypeInfo(id: ProjectType): ProjectTypeInfo {
  const info = PROJECT_TYPES.find((t) => t.id === id);
  // The `ProjectType` union and `PROJECT_TYPES` are kept in sync, so this is
  // exhaustive; the throw guards against an out-of-sync edit.
  if (!info) throw new Error(`Unknown project type: ${id}`);
  return info;
}
