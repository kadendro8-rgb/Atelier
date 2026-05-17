"use client";

/**
 * SitePhotoPreview — the render seam, made reachable.
 *
 * This is the surface where the photoreal image-generation step plugs in. It
 * takes the contractor's captured site photo, runs it through the image-gen
 * provider seam (`lib/imagegen`), and renders whichever outcome comes back:
 *
 *  - `ok`             → the generated photoreal image (real provider, future);
 *  - `not-configured` → a tasteful placeholder (the keyless default today);
 *  - `failed`         → a calm, retryable error.
 *
 * No render *route* is invented — the seam lives inline on the lot step so it
 * is demonstrably exercised the moment a photo is captured. When a real
 * provider is registered in `lib/imagegen/index.ts`, this surface starts
 * showing real renders with zero changes here.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ImageOff, Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  generateSitePreview,
  type DesignIntent,
  type ImageGenResult,
  type SourcePhoto,
} from "@/lib/imagegen";

const EASE = [0.16, 1, 0.3, 1] as const;

interface SitePhotoPreviewProps {
  /** The captured site photo, as a provider-ready source. */
  photo: SourcePhoto;
  /** Structured design intent threaded to the provider. */
  intent: DesignIntent;
  className?: string;
}

export function SitePhotoPreview({
  photo,
  intent,
  className,
}: SitePhotoPreviewProps) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<"rendering" | "done">("rendering");
  const [result, setResult] = useState<ImageGenResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState("rendering");
    setResult(null);
    // The seam contract guarantees this resolves (never throws).
    void generateSitePreview({
      photo,
      intent,
      signal: controller.signal,
    }).then((res) => {
      if (controller.signal.aborted) return;
      setResult(res);
      setState("done");
    });
  }, [photo, intent]);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
  }, [run]);

  const transition = reduce ? { duration: 0 } : { duration: 0.45, ease: EASE };

  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-copper/15 text-copper">
          <Wand2 className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base tracking-tight text-foreground">
            Design preview on your photo
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-2">
            Atelier brings the design vision to life on the real site photo.
          </p>
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-lg border border-border bg-ink">
        {/* The real site photo is always the backdrop — honest about what's real. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.dataUrl}
          alt="Site photo"
          className={cn(
            "block max-h-[20rem] w-full object-contain transition-all",
            state === "rendering" && "scale-[1.01] blur-[2px]",
          )}
        />

        <AnimatePresence mode="wait">
          {state === "rendering" && (
            <motion.div
              key="rendering"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0 }}
              transition={transition}
              className="absolute inset-0 grid place-items-center bg-ink/55 backdrop-blur-[1px]"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-border-bright bg-ink/80 px-3 py-1.5 text-xs text-foreground">
                <Loader2 className="size-3.5 animate-spin text-copper" />
                Reading the seam…
              </span>
            </motion.div>
          )}

          {state === "done" && result?.status === "ok" && (
            <motion.img
              key="generated"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transition}
              src={result.imageUrl}
              alt="Generated design rendered on the site photo"
              className="absolute inset-0 h-full w-full object-contain"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Outcome strip — honest about the keyless default. */}
      <AnimatePresence mode="wait">
        {state === "done" && result && (
          <motion.div
            key={result.status}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={transition}
            className="mt-3"
          >
            {result.status === "ok" && (
              <p className="flex items-center gap-1.5 text-xs text-sage">
                <Sparkles className="size-3.5" />
                Rendered by {result.provider}
                {result.note ? ` · ${result.note}` : ""}
              </p>
            )}

            {result.status === "not-configured" && (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 p-3">
                <ImageOff className="mt-0.5 size-4 shrink-0 text-muted-2" />
                <p className="text-xs leading-relaxed text-muted">
                  {result.message}
                </p>
              </div>
            )}

            {result.status === "failed" && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 p-3">
                <p className="text-xs leading-relaxed text-copper-bright">
                  {result.message}
                </p>
                <Button variant="subtle" size="sm" onClick={run}>
                  <RefreshCw className="size-3.5" /> Retry
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
