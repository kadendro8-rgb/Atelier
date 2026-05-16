"use client";

import type { PlanGraph } from "@/lib/kernel/types";

/**
 * Interactive SVG floor-plan canvas.
 *
 * TODO(v2-section-1): render walls/openings/rooms as scaled inline SVG,
 * drag-to-edit with solver re-run, room inspector, zoom/pan, and the
 * floating toolbar. See docs/v2-spec.md §1.2.
 */
export function PlanCanvas({ graph }: { graph: PlanGraph }) {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted-2">
      Plan canvas — v2 Section 1 ({graph.rooms.length} rooms)
    </div>
  );
}
