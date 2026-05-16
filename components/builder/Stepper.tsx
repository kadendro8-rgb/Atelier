"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepKey = "brief" | "plan" | "site" | "renders" | "portal";

export const STEP_ORDER: { key: StepKey; label: string }[] = [
  { key: "brief", label: "Brief" },
  { key: "plan", label: "Floor plan" },
  { key: "site", label: "Site" },
  { key: "renders", label: "Renders" },
  { key: "portal", label: "Portal" },
];

export function Stepper({
  current,
  onNavigate,
}: {
  current: StepKey;
  onNavigate: (key: StepKey) => void;
}) {
  const currentIndex = STEP_ORDER.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {STEP_ORDER.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const reachable = i <= currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onNavigate(step.key)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                active && "border-copper bg-copper/15 text-copper-bright",
                done &&
                  "border-border-bright bg-surface-2 text-foreground hover:border-copper",
                !active && !done && "border-border bg-surface text-muted-2",
                reachable ? "cursor-pointer" : "cursor-not-allowed",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[10px]",
                  active && "bg-copper text-ink",
                  done && "bg-sage text-ink",
                  !active && !done && "bg-surface-3 text-muted-2",
                )}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < STEP_ORDER.length - 1 && (
              <span
                className={cn(
                  "h-px w-3 sm:w-6",
                  i < currentIndex ? "bg-sage/60" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
