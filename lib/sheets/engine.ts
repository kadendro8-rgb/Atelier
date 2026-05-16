import type { PlanGraph } from "@/lib/kernel/types";

export type SheetSize =
  | "ANSI-A"
  | "ANSI-B"
  | "ANSI-C"
  | "ANSI-D"
  | "ANSI-E"
  | "ARCH-A"
  | "ARCH-B"
  | "ARCH-C"
  | "ARCH-D"
  | "ARCH-E";

export type Sheet = {
  /** e.g. "A-101". */
  number: string;
  name: string;
  size: SheetSize;
};

// DECISION: spec §3.2 calls for @react-pdf/renderer rendering at 24"×36",
// which is the ARCH-D sheet size. Per the CORE scope this module is a pure
// data model only — it returns the sheet list, not rendered PDF pages.
const STANDARD_SHEET_SIZE: SheetSize = "ARCH-D";

/**
 * Auto-generate the standard construction sheet set for a design.
 *
 * This is a DATA MODEL only — it returns the ordered list of sheets that the
 * (separate, out-of-CORE-scope) PDF renderer would draw. Sheets whose source
 * data is absent from the graph are skipped.
 *
 * See docs/v2-spec.md §3.2.
 */
export function generateSheetSet(graph: PlanGraph): Sheet[] {
  const sheets: Sheet[] = [];

  const mk = (number: string, name: string): Sheet => ({
    number,
    name,
    size: STANDARD_SHEET_SIZE,
  });

  // A-000 — General notes. Always present: it carries code data, abbreviations
  // and the sheet index, none of which depend on graph contents.
  sheets.push(mk("A-000", "General Notes & Sheet Index"));

  // A-100 — Site plan. Requires an overall footprint to site the building.
  const hasFootprint = graph.bounds.width > 0 && graph.bounds.height > 0;
  if (hasFootprint) {
    sheets.push(mk("A-100", "Site Plan"));
  }

  // A-101 — Main level floor plan. Requires rooms to draw.
  const hasRooms = graph.rooms.length > 0;
  if (hasRooms) {
    sheets.push(mk("A-101", `${graph.level} Floor Plan`));
  }

  // A-201 — Exterior elevations. Requires exterior walls and a roof.
  const hasExteriorWalls = graph.walls.some((w) => w.kind === "exterior");
  if (hasExteriorWalls) {
    sheets.push(mk("A-201", "Exterior Elevations"));
  }

  // A-301 — Building section. Requires walls to cut through.
  if (graph.walls.length > 0) {
    sheets.push(mk("A-301", "Building Section"));
  }

  // A-401 — Schedules (door / window / room finish). Requires schedulable
  // items: openings for door/window schedules, or rooms for the finish schedule.
  if (graph.openings.length > 0 || hasRooms) {
    sheets.push(mk("A-401", "Door, Window & Finish Schedules"));
  }

  // A-501 — Kitchen & bath enlarged plans. Only when those rooms exist.
  const hasKitchenOrBath = graph.rooms.some(
    (r) => r.use === "kitchen" || r.use === "bathroom",
  );
  if (hasKitchenOrBath) {
    sheets.push(mk("A-501", "Enlarged Kitchen & Bath Plans"));
  }

  return sheets;
}
