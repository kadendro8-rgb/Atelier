"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, PencilRuler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFloorPlan, type Design, type PlanOptions } from "@/lib/design";
import { FloorPlanSVG } from "./FloorPlanSVG";
import { cn } from "@/lib/utils";

const legend: { tone: string; label: string }[] = [
  { tone: "bg-copper/40", label: "Living" },
  { tone: "bg-sage/40", label: "Bedrooms" },
  { tone: "bg-copper/70", label: "Primary suite" },
  { tone: "bg-surface-3", label: "Service" },
];

export function PlanStep({
  design,
  options,
  onOptionsChange,
  onBack,
  onContinue,
}: {
  design: Design;
  options: PlanOptions;
  onOptionsChange: (next: PlanOptions) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const reduce = useReducedMotion();
  const plan = useMemo(
    () => buildFloorPlan(design.params, options),
    [design.params, options],
  );

  const set = (patch: Partial<PlanOptions>) =>
    onOptionsChange({ ...options, ...patch });

  return (
    <div className="mx-auto max-w-5xl">
      <Header
        step="Step 2 · Floor plan"
        title="Refine the floor plan"
        sub="Atelier drafted a plan from the brief. Adjust it live — every edit re-checks the building code."
      />

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        {/* plan canvas */}
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              {design.projectName}
            </span>
            <span className="text-xs text-muted-2">{plan.level}</span>
          </div>
          <div
            className="relative mt-3 overflow-hidden rounded-lg border border-border bg-ink-2"
            style={{ aspectRatio: `${plan.width} / ${plan.height}` }}
          >
            <AnimatePresence mode="sync">
              <motion.div
                key={`${options.garageBays}-${options.porch}-${options.office}`}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0"
              >
                <FloorPlanSVG plan={plan} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className={cn("size-2.5 rounded-[3px]", l.tone)} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* edit panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <PencilRuler className="size-4 text-copper" />
              Live edits
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-muted-2">Garage</p>
                <div className="mt-1.5 flex gap-1.5">
                  {[2, 3].map((bays) => (
                    <button
                      key={bays}
                      type="button"
                      onClick={() => set({ garageBays: bays })}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                        options.garageBays === bays
                          ? "border-copper bg-copper/15 text-copper-bright"
                          : "border-border bg-surface-2 text-muted hover:border-border-bright",
                      )}
                    >
                      {bays}-car
                    </button>
                  ))}
                </div>
              </div>

              <Toggle
                label="Covered porch"
                hint="Adds a porch across the living wing"
                checked={options.porch}
                onChange={(v) => set({ porch: v })}
              />
              <Toggle
                label="Home office"
                hint="Carves a study from the dining area"
                checked={options.office}
                onChange={(v) => set({ office: v })}
              />
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-4">
            <p className="text-xs font-medium text-foreground">Code check</p>
            <ul className="mt-2.5 space-y-1.5">
              {[
                "Bedroom egress windows — clear",
                "Great-room beam span — within limits",
                `${design.params.beds} beds · ${design.params.baths} baths resolved`,
                "Hallway & door widths — ADA-friendly",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-sage" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="subtle" onClick={onBack} className="flex-1">
              <ArrowLeft className="size-4" /> Brief
            </Button>
            <Button onClick={onContinue} className="flex-[2]">
              Site the plan <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({
  step,
  title,
  sub,
}: {
  step: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
        {step}
      </span>
      <h1 className="mt-4 font-display text-2xl tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{sub}</p>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="block text-xs font-medium text-foreground">{label}</span>
        <span className="block text-[11px] text-muted-2">{hint}</span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
          checked ? "border-copper bg-copper/70" : "border-border-bright bg-surface-3",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-3.5 rounded-full bg-foreground transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
