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

/**
 * Auto-generate the standard construction sheet set for a design.
 *
 * TODO(v2-section-3): produce A-000 … A-501 per docs/v2-spec.md §3.2,
 * render each via @react-pdf/renderer at 24"×36" with AIA line weights,
 * and export a single multi-page PDF.
 */
export function generateSheetSet(graph: PlanGraph): Sheet[] {
  void graph;
  return [];
}
