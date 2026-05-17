"use client";

/**
 * BuildRenderPanel — the geometry-accurate "build render" surface.
 *
 * This is the truthful project visualization in the package Client view: a
 * still drawn straight from the 3D model the contractor designed — correct
 * layout, proportions, and materials. It is keyless and provider-free: no AI,
 * no API. The image cannot hallucinate; it can only depict the geometry.
 *
 * It loads the matching 3D viewport (`Viewport3D` for `home`,
 * `HardscapeViewport3D` for `hardscape`) dynamically with `ssr: false`, since
 * three.js is client-only. The viewport exposes a "Capture render" control;
 * the captured PNG is promoted into a framed still here.
 *
 * The companion AI photoreal path (`SitePhotoPreview` over `lib/imagegen`)
 * stays a separate, intact seam — this panel never touches it.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Box, Camera, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanGraph } from "@/lib/kernel/types";
import type { HardscapePlan } from "@/lib/hardscape/types";
import { downloadCapture, type RenderCapture } from "@/lib/render/capture";

const EASE = [0.16, 1, 0.3, 1] as const;

const ViewportFallback = () => (
  <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted-2">
    Loading 3D model…
  </div>
);

// Three.js is client-only — load both viewports without SSR, exactly as the
// floor-plan step does. They stay out of every non-3D route bundle.
const Viewport3D = dynamic(
  () => import("@/components/builder/Viewport3D").then((m) => m.Viewport3D),
  { ssr: false, loading: ViewportFallback },
);

const HardscapeViewport3D = dynamic(
  () =>
    import("@/components/builder/HardscapeViewport3D").then(
      (m) => m.HardscapeViewport3D,
    ),
  { ssr: false, loading: ViewportFallback },
);

interface BuildRenderPanelProps {
  homePlan: PlanGraph | null;
  hardscapePlan: HardscapePlan | null;
  isHardscape: boolean;
}

export function BuildRenderPanel({
  homePlan,
  hardscapePlan,
  isHardscape,
}: BuildRenderPanelProps) {
  const reduce = useReducedMotion();
  const [capture, setCapture] = useState<RenderCapture | null>(null);

  const hasModel = isHardscape ? !!hardscapePlan : !!homePlan;

  const transition = reduce ? { duration: 0 } : { duration: 0.45, ease: EASE };

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-copper/15 text-copper">
          <Box className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base tracking-tight text-foreground">
            The build render
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-2">
            Drawn straight from the model you designed — true to the layout,
            dimensions, and materials. Not an AI image.
          </p>
        </div>
      </div>

      {!hasModel ? (
        <div className="mt-4 grid aspect-video place-items-center rounded-lg border border-dashed border-border bg-ink">
          <p className="max-w-[18rem] text-center text-xs text-muted-2">
            No model to render yet — design the project first and the build
            render lights up here.
          </p>
        </div>
      ) : capture ? (
        // The captured still — a framed, downloadable geometry-true render.
        <div className="mt-4">
          <div className="overflow-hidden rounded-lg border border-border bg-ink">
            <AnimatePresence mode="wait">
              <motion.img
                key={capture.dataUrl.slice(0, 64)}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transition}
                src={capture.dataUrl}
                alt="Geometry-accurate render of the designed project"
                className="block aspect-video w-full object-cover"
              />
            </AnimatePresence>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-sage">
              Geometry-accurate render · {capture.width}×{capture.height} ·
              generated from the 3D model
            </p>
            <div className="flex gap-2">
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setCapture(null)}
              >
                <RotateCcw className="size-3.5" /> Re-frame
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() =>
                  downloadCapture(
                    capture,
                    isHardscape
                      ? "atelier-hardscape-render.png"
                      : "atelier-home-render.png",
                  )
                }
              >
                <Download className="size-3.5" /> Download
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // The live model — orbit to frame it, then capture the build render.
        <div className="mt-4">
          {isHardscape && hardscapePlan ? (
            <HardscapeViewport3D plan={hardscapePlan} onCapture={setCapture} />
          ) : homePlan ? (
            <Viewport3D graph={homePlan} onCapture={setCapture} />
          ) : null}
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-2">
            <Camera className="size-3.5 text-copper" />
            Orbit to frame the model, then capture a high-resolution still.
          </p>
        </div>
      )}
    </div>
  );
}
