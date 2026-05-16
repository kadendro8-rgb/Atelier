"use client";

import type { PlanGraph } from "@/lib/kernel/types";

/**
 * Real-time 3D viewport.
 *
 * TODO(v2-section-2): React Three Fiber + drei scene built from the plan
 * graph — extruded walls, CSG openings, PBR materials, HDRI + SunCalc
 * lighting, orbit/walk/preset cameras. See docs/v2-spec.md §2.
 */
export function Viewport3D({ graph }: { graph: PlanGraph }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted-2">
      3D viewport — v2 Section 2 ({graph.roof} roof)
    </div>
  );
}
