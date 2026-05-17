"use client";

/**
 * First-run guided tour for the builder.
 *
 * A dismissible coachmark sequence that spotlights real controls as the
 * visitor moves through the builder. It anchors to `data-tour="…"` elements,
 * advances on Next, is skippable, and persists "seen" state so it shows once.
 *
 * The tour spans three routes (lot → brief → floor-plan). Each mounted
 * `GuidedTour` is told its `route` and renders only the steps for that route;
 * progress is carried across navigations in `sessionStorage`, so finishing the
 * lot-route steps and moving to the brief picks the tour back up there.
 *
 * Keyless, offline-safe, and `prefers-reduced-motion` aware.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import {
  TOUR_STEPS,
  hasTourBeenSeen,
  markTourSeen,
  resetTourSeen,
  type TourPlacement,
  type TourRoute,
  type TourStep,
} from "@/lib/tour";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** sessionStorage key for the tour's cross-route progress cursor. */
const TOUR_CURSOR_KEY = "atelier:tourCursor";

/** Window event a "Replay tour" affordance dispatches to restart the tour. */
const TOUR_REPLAY_EVENT = "atelier:tour-replay";

/**
 * Restart the guided tour from its first step. Clears persisted state and
 * notifies any mounted `GuidedTour` on the current page to re-open. Safe to
 * call from anywhere in the builder.
 */
export function replayGuidedTour(): void {
  resetTourSeen();
  try {
    window.sessionStorage.removeItem(TOUR_CURSOR_KEY);
  } catch {
    // Best-effort.
  }
  window.dispatchEvent(new Event(TOUR_REPLAY_EVENT));
}

/** Padding around the spotlit element, in px. */
const SPOTLIGHT_PAD = 8;
/** Gap between the anchor and the coachmark card, in px. */
const CARD_GAP = 14;
/** Approximate card size used for placement math before measurement. */
const CARD_W = 320;
const CARD_H = 188;

/** A measured rectangle for the spotlight + card positioning. */
interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Read the global tour cursor (index into `TOUR_STEPS`). */
function readCursor(): number {
  try {
    const raw = window.sessionStorage.getItem(TOUR_CURSOR_KEY);
    const n = raw == null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Persist the global tour cursor. Best-effort. */
function writeCursor(index: number): void {
  try {
    window.sessionStorage.setItem(TOUR_CURSOR_KEY, String(index));
  } catch {
    // Best-effort — falls back to restarting the route's steps.
  }
}

/**
 * Mounts the guided tour for a builder `route`. Drop one into each builder
 * page. It self-suppresses when the tour has been seen or has no steps left
 * for the current route.
 */
export function GuidedTour({ route }: { route: TourRoute }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // The active index into the *global* TOUR_STEPS array.
  const [cursor, setCursor] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  // --- Decide whether to run, and where to resume ---------------------------
  const begin = useCallback(
    (fromReplay: boolean) => {
      if (!fromReplay && hasTourBeenSeen()) return;

      const startAt = fromReplay ? 0 : readCursor();
      const firstForRoute = TOUR_STEPS.findIndex(
        (s, i) => i >= startAt && s.route === route,
      );
      // No step for this route at/after the cursor — nothing to show here.
      if (firstForRoute === -1) {
        // If every step is behind us, the tour is effectively complete.
        if (startAt >= TOUR_STEPS.length) markTourSeen();
        return;
      }
      setCursor(firstForRoute);
      writeCursor(firstForRoute);
      track("builder_tour_started", {
        route,
        step: TOUR_STEPS[firstForRoute].id,
        replay: fromReplay,
      });
    },
    [route],
  );

  useEffect(() => {
    setMounted(true);
    begin(false);
    const onReplay = () => begin(true);
    window.addEventListener(TOUR_REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(TOUR_REPLAY_EVENT, onReplay);
  }, [begin]);

  const step: TourStep | null = cursor == null ? null : TOUR_STEPS[cursor] ?? null;
  const active = step != null && step.route === route;

  // --- Locate + measure the anchored element --------------------------------
  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(
      `[data-tour="${step.id}"]`,
    );
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    if (!active) return;
    // The anchor may mount a tick after the page (Suspense, dynamic import).
    let raf = 0;
    let tries = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-tour="${step!.id}"]`,
      );
      if (el || tries > 30) {
        measure();
        return;
      }
      tries += 1;
      raf = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(raf);
  }, [active, measure, step]);

  // Keep the spotlight glued to the anchor through scroll / resize.
  useEffect(() => {
    if (!active) return;
    const onChange = () => measure();
    window.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    return () => {
      window.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [active, measure]);

  // Bring the anchored element into view when a step opens.
  useEffect(() => {
    if (!active || !step) return;
    const el = document.querySelector<HTMLElement>(
      `[data-tour="${step.id}"]`,
    );
    el?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });
  }, [active, step, reduce]);

  // --- Dismiss + advance ----------------------------------------------------
  const dismiss = useCallback(
    (reason: "skip" | "complete") => {
      markTourSeen();
      if (step) {
        track("builder_tour_dismissed", { reason, lastStep: step.id });
      }
      setCursor(null);
      setRect(null);
    },
    [step],
  );

  const next = useCallback(() => {
    if (cursor == null) return;
    const nextIndex = cursor + 1;
    track("builder_tour_step_advanced", {
      from: TOUR_STEPS[cursor].id,
      to: TOUR_STEPS[nextIndex]?.id ?? "done",
    });
    writeCursor(nextIndex);
    if (nextIndex >= TOUR_STEPS.length) {
      dismiss("complete");
      return;
    }
    const nextStep = TOUR_STEPS[nextIndex];
    // Same route → show it here. Different route → the next page's GuidedTour
    // picks it up from the persisted cursor; close this instance quietly.
    if (nextStep.route === route) {
      setCursor(nextIndex);
    } else {
      setCursor(null);
      setRect(null);
    }
  }, [cursor, route, dismiss]);

  // ESC dismisses; focus the skip control when a step opens.
  useEffect(() => {
    if (!active) return;
    skipRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss("skip");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, dismiss]);

  if (!mounted || !active || !step) return null;

  // Position within the global tour for the "Step n of m" affordance.
  const stepNumber = (cursor ?? 0) + 1;
  const total = TOUR_STEPS.length;
  const isLast = (cursor ?? 0) === total - 1;

  return createPortal(
    <TourLayer
      step={step}
      rect={rect}
      reduce={reduce ?? false}
      stepNumber={stepNumber}
      total={total}
      isLast={isLast}
      cardRef={cardRef}
      skipRef={skipRef}
      onSkip={() => dismiss("skip")}
      onNext={next}
    />,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* Overlay + coachmark                                                        */
/* -------------------------------------------------------------------------- */

function TourLayer({
  step,
  rect,
  reduce,
  stepNumber,
  total,
  isLast,
  cardRef,
  skipRef,
  onSkip,
  onNext,
}: {
  step: TourStep;
  rect: Rect | null;
  reduce: boolean;
  stepNumber: number;
  total: number;
  isLast: boolean;
  cardRef: React.RefObject<HTMLDivElement | null>;
  skipRef: React.RefObject<HTMLButtonElement | null>;
  onSkip: () => void;
  onNext: () => void;
}) {
  const headingId = `tour-${step.id}-title`;
  const bodyId = `tour-${step.id}-body`;

  // Spotlight cut-out — falls back to a centred card when no anchor is found.
  const spot = rect
    ? {
        top: rect.top - SPOTLIGHT_PAD,
        left: rect.left - SPOTLIGHT_PAD,
        width: rect.width + SPOTLIGHT_PAD * 2,
        height: rect.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  const card = cardPosition(spot, step.placement);

  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.32, ease: EASE };

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={bodyId}
    >
      {/* Scrim with a soft spotlight cut-out via box-shadow. Clicking it skips. */}
      {spot ? (
        <motion.div
          aria-hidden="true"
          onClick={onSkip}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className="absolute rounded-xl"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            boxShadow:
              "0 0 0 9999px rgba(11,10,9,0.74), 0 0 0 1px rgba(210,138,85,0.55)",
          }}
        />
      ) : (
        <motion.div
          aria-hidden="true"
          onClick={onSkip}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition}
          className="absolute inset-0 bg-ink/74"
        />
      )}

      {/* Coachmark card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={cardRef}
          initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
          transition={transition}
          className={cn(
            "absolute w-[min(20rem,calc(100vw-2rem))] rounded-card border border-border-bright bg-surface p-5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]",
          )}
          style={card}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
              <span className="size-1.5 rounded-full bg-copper" />
              Step {stepNumber} of {total}
            </span>
            <button
              ref={skipRef}
              type="button"
              onClick={onSkip}
              aria-label="Skip the guided tour"
              className="-mr-1 -mt-1 grid size-7 place-items-center rounded-full text-muted-2 transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40"
            >
              <X className="size-4" />
            </button>
          </div>

          <h2
            id={headingId}
            className="mt-3 font-display text-base tracking-tight text-foreground"
          >
            {step.title}
          </h2>
          <p
            id={bodyId}
            className="mt-1.5 text-sm leading-relaxed text-muted"
          >
            {step.body}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-muted-2 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:text-foreground"
            >
              Skip tour
            </button>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-copper px-4 text-sm font-medium text-ink transition-colors hover:bg-copper-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {isLast ? "Done" : "Next"}
              {!isLast && <ArrowRight className="size-3.5" />}
            </button>
          </div>

          {/* Progress dots */}
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === stepNumber - 1
                    ? "w-4 bg-copper"
                    : "w-1.5 bg-border-bright",
                )}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Compute the coachmark card's fixed position from the spotlight rect and the
 * step's preferred placement, flipping/clamping so it never leaves the
 * viewport. Falls back to centred when there's no anchor.
 */
function cardPosition(
  spot: Rect | null,
  placement: TourPlacement,
): { top: number; left: number } {
  if (typeof window === "undefined" || !spot) {
    return {
      top: Math.max(16, (typeof window !== "undefined" ? window.innerHeight : 800) / 2 - CARD_H / 2),
      left: Math.max(16, (typeof window !== "undefined" ? window.innerWidth : 1200) / 2 - CARD_W / 2),
    };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = spot.left + spot.width / 2;
  const cy = spot.top + spot.height / 2;

  // Resolve a vertical placement, flipping if it would overflow.
  let place: TourPlacement = placement;
  if (place === "bottom" && spot.top + spot.height + CARD_GAP + CARD_H > vh) {
    place = "top";
  } else if (place === "top" && spot.top - CARD_GAP - CARD_H < 0) {
    place = "bottom";
  }

  let top: number;
  let left: number;
  switch (place) {
    case "top":
      top = spot.top - CARD_GAP - CARD_H;
      left = cx - CARD_W / 2;
      break;
    case "left":
      top = cy - CARD_H / 2;
      left = spot.left - CARD_GAP - CARD_W;
      break;
    case "right":
      top = cy - CARD_H / 2;
      left = spot.left + spot.width + CARD_GAP;
      break;
    case "bottom":
    default:
      top = spot.top + spot.height + CARD_GAP;
      left = cx - CARD_W / 2;
      break;
  }

  // Clamp into the viewport with a 16px margin.
  left = Math.min(Math.max(16, left), Math.max(16, vw - CARD_W - 16));
  top = Math.min(Math.max(16, top), Math.max(16, vh - CARD_H - 16));
  return { top, left };
}
