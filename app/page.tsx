"use client";

/**
 * Atelier — the hardscape design generator.
 *
 * The entire product is this one page: describe a backyard on the left, and a
 * scaled, priced hardscape design appears live on the right. The brief is a
 * controlled `HardscapeBrief`; every edit re-derives the plan deterministically
 * through `generateHardscape`, so the result panel feels alive as you type.
 */

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Layers, Ruler, Square } from "lucide-react";
import { Logo } from "@/components/Logo";
import { HardscapeBriefBuilder } from "@/components/builder/HardscapeBriefBuilder";
import {
  HardscapeLayoutSVG,
  HardscapeLegend,
} from "@/components/builder/HardscapeLayoutSVG";
import {
  defaultHardscapeBrief,
  formatCents,
  loadHardscapeBrief,
  materialInfo,
  saveHardscapeBrief,
} from "@/lib/hardscape/builder";
import { estimateCost } from "@/lib/hardscape/cost";
import { generateHardscape } from "@/lib/hardscape/generate";
import type { HardscapeBrief } from "@/lib/hardscape/types";

// three.js is client-only — load the 3D viewport without SSR.
const HardscapeViewport3D = dynamic(
  () =>
    import("@/components/builder/HardscapeViewport3D").then(
      (m) => m.HardscapeViewport3D,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted-2">
        Loading 3D viewport…
      </div>
    ),
  },
);

type ViewMode = "2d" | "3d";

export default function HardscapeGeneratorPage() {
  // The working brief. Starts from a sensible default so a fresh visitor sees
  // a real, generatable design immediately; a cached brief is restored on
  // mount once we know we're on the client (localStorage is browser-only).
  const [brief, setBrief] = useState<HardscapeBrief>(defaultHardscapeBrief);
  const [view, setView] = useState<ViewMode>("2d");

  // Restore any cached brief once, after mount.
  useEffect(() => {
    const cached = loadHardscapeBrief();
    if (cached) setBrief(cached);
  }, []);

  // Persist every brief change — best-effort, never throws.
  useEffect(() => {
    saveHardscapeBrief(brief);
  }, [brief]);

  // Derive the plan live. `generateHardscape` is deterministic and cheap, so
  // we regenerate on every brief change rather than caching a stale plan.
  const plan = useMemo(() => generateHardscape(brief), [brief]);
  const cost = useMemo(() => estimateCost(plan), [plan]);

  return (
    <div className="min-h-dvh bg-ink text-foreground">
      {/* ----- Header ---------------------------------------------------- */}
      <header className="border-b border-border bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4 sm:px-8">
          <Logo className="size-8 shrink-0 text-copper" />
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight tracking-tight">
              Atelier
            </p>
            <p className="truncate text-xs text-muted">
              Describe a backyard. Get a real hardscape design — instantly.
            </p>
          </div>
        </div>
      </header>

      {/* ----- Two-column workspace -------------------------------------- */}
      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          {/* Brief — left */}
          <section
            aria-label="Backyard brief"
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-copper" />
              <h1 className="text-sm font-medium text-foreground">
                The brief
              </h1>
            </div>
            <HardscapeBriefBuilder brief={brief} onChange={setBrief} />
          </section>

          {/* Result — right */}
          <section
            aria-label="Generated design"
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col rounded-card border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-foreground">
                  Generated site layout
                </h2>
                <ViewToggle view={view} onChange={setView} />
              </div>

              {view === "2d" ? (
                <HardscapeLayoutSVG plan={plan} />
              ) : (
                <HardscapeViewport3D plan={plan} />
              )}

              <div className="mt-4 rounded-card border border-border bg-ink-2 p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-2">
                  Materials
                </p>
                <div className="mt-2">
                  <HardscapeLegend plan={plan} />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-2">
                Generated by the hardscape design kernel from your brief.
                Deterministic — the same brief always lays out the same way.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <CostCard
                cost={cost}
                totalAreaSqft={plan.totalAreaSqft}
                elementCount={plan.elements.length}
              />
              <SurfacesCard plan={plan} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2D / 3D toggle                                                             */
/* -------------------------------------------------------------------------- */

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const opts: { id: ViewMode; label: string; icon: typeof Square }[] = [
    { id: "2d", label: "2D", icon: Square },
    { id: "3d", label: "3D", icon: Box },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-ink-2 p-0.5">
      {opts.map((o) => {
        const active = view === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-copper text-ink"
                : "text-muted-2 hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cost panel                                                                 */
/* -------------------------------------------------------------------------- */

function CostCard({
  cost,
  totalAreaSqft,
  elementCount,
}: {
  cost: { lowCents: number; highCents: number };
  totalAreaSqft: number;
  elementCount: number;
}) {
  return (
    <aside className="h-fit rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Ruler className="size-4 text-sage" />
        <h2 className="text-sm font-medium text-foreground">Cost estimate</h2>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-2">
          Installed
        </span>
      </div>

      <p className="mt-3 font-display text-2xl tracking-tight text-copper-bright">
        {formatCents(cost.lowCents)} – {formatCents(cost.highCents)}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <div className="bg-surface-2 p-3">
          <dt className="text-[10px] uppercase tracking-wide text-muted-2">
            Total area
          </dt>
          <dd className="mt-0.5 font-display text-base tracking-tight text-foreground">
            {Math.round(totalAreaSqft).toLocaleString()} ft²
          </dd>
        </div>
        <div className="bg-surface-2 p-3">
          <dt className="text-[10px] uppercase tracking-wide text-muted-2">
            Surfaces
          </dt>
          <dd className="mt-0.5 font-display text-base tracking-tight text-foreground">
            {elementCount}
          </dd>
        </div>
      </dl>

      <p className="mt-3 rounded-lg border border-border bg-ink-2 p-3 text-[11px] leading-relaxed text-muted-2">
        A planning range, not a bid. A real estimate localizes by region,
        thickness, sub-base, and site access.
      </p>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces list                                                              */
/* -------------------------------------------------------------------------- */

function SurfacesCard({
  plan,
}: {
  plan: ReturnType<typeof generateHardscape>;
}) {
  return (
    <aside className="h-fit rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-copper" />
        <h2 className="text-sm font-medium text-foreground">Surfaces</h2>
        <span className="ml-auto text-xs text-muted-2">
          {plan.elements.length}
        </span>
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-border">
        {plan.elements.map((el) => {
          const info = materialInfo(el.material);
          return (
            <li
              key={el.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-3 shrink-0 rounded-sm border border-border-bright"
                  style={{ backgroundColor: info.swatch }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-foreground">
                    {el.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted-2">
                    {info.label}
                  </span>
                </span>
              </span>
              <span className="shrink-0 font-display text-sm tracking-tight text-foreground">
                {Math.round(el.areaSqft).toLocaleString()} ft²
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
