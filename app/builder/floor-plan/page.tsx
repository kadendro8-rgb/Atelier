"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Compass,
  Layers,
  Ruler,
  Square,
} from "lucide-react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { GuidedTour } from "@/components/builder/GuidedTour";
import { PlanCanvas } from "@/components/builder/PlanCanvas";
import {
  HardscapeLayoutSVG,
  HardscapeLegend,
} from "@/components/builder/HardscapeLayoutSVG";
import { Button } from "@/components/ui/button";
import type { ParsedRequirements } from "@/lib/builder";
import type { ProjectType } from "@/lib/db/types";
import {
  defaultHardscapeBrief,
  formatCents,
  loadHardscapeBrief,
  loadHardscapePlan,
  materialInfo,
  resolveProjectType,
  saveHardscapePlan,
} from "@/lib/hardscape/builder";
import { estimateCost } from "@/lib/hardscape/cost";
import { generateHardscape } from "@/lib/hardscape/generate";
import type { HardscapePlan } from "@/lib/hardscape/types";
import { toParsedBrief } from "@/lib/kernel/adapt";
import { validatePlan, type CodeViolation } from "@/lib/kernel/codeCheck";
import { generatePlan } from "@/lib/kernel/plan";
import type { PlanGraph } from "@/lib/kernel/types";

// Three.js is client-only — load the 3D viewports without SSR.
const Viewport3D = dynamic(
  () => import("@/components/builder/Viewport3D").then((m) => m.Viewport3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted-2">
        Loading 3D viewport…
      </div>
    ),
  },
);

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

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// DECISION: a fixed kernel seed keeps the generated plan stable across renders
// and reloads for a given brief — the spec mandates deterministic output, and
// re-rolling the layout on every visit would be jarring. A future "regenerate"
// control can vary this.
const PLAN_SEED = 1;

type ViewMode = "2d" | "3d";

/** localStorage key for the keyless plan-graph cache. */
const planCacheKey = (projectId: string | null) =>
  `atelier:plan:${projectId ?? "local"}`;

/** Best-effort kernel-PlanGraph shape guard for restored/stored JSON. */
function isPlanGraph(value: unknown): value is PlanGraph {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Array.isArray((value as { rooms?: unknown }).rooms)
  );
}

export default function FloorPlanPage() {
  return (
    <Suspense
      fallback={<BuilderShell current="floor-plan">{null}</BuilderShell>}
    >
      <FloorPlanRouter />
    </Suspense>
  );
}

/**
 * Resolves the active project type and dispatches to the matching layout step.
 * Hardscape projects render a 2D site layout from the hardscape kernel;
 * everything else renders the original floor-plan flow.
 */
function FloorPlanRouter() {
  const searchParams = useSearchParams();
  const [projectType, setProjectType] = useState<ProjectType | null>(null);

  useEffect(() => {
    setProjectType(resolveProjectType(searchParams.get("type")));
  }, [searchParams]);

  if (projectType === null) {
    return <BuilderShell current="floor-plan">{null}</BuilderShell>;
  }

  if (projectType === "hardscape") {
    return <HardscapeLayoutStep />;
  }
  return <FloorPlanStep />;
}

/* -------------------------------------------------------------------------- */
/* Hardscape layout step                                                      */
/* -------------------------------------------------------------------------- */

function HardscapeLayoutStep() {
  const [plan, setPlan] = useState<HardscapePlan | null>(null);
  const [hasBrief, setHasBrief] = useState<boolean | null>(null);
  const [view, setView] = useState<ViewMode>("2d");
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();

  const projectId = searchParams.get("projectId");

  // Build the layout: prefer a cached plan for reload-safety, otherwise run
  // the kernel deterministically from the cached brief.
  useEffect(() => {
    const cachedPlan = loadHardscapePlan(projectId);
    if (cachedPlan) {
      setPlan(cachedPlan);
      setHasBrief(true);
      return;
    }
    const brief = loadHardscapeBrief();
    if (!brief) {
      // No brief stored — still generate from the default so a deep link to
      // the layout step never dead-ends, but flag that the brief was implied.
      const fallback = generateHardscape(defaultHardscapeBrief(), PLAN_SEED);
      setPlan(fallback);
      setHasBrief(false);
      return;
    }
    const generated = generateHardscape(brief, PLAN_SEED);
    setPlan(generated);
    setHasBrief(true);
  }, [projectId]);

  // Persist the generated plan — keyless, best-effort. DB persistence is
  // intentionally not attempted: the typed `savePlanGraph` helpers model the
  // home `PlanGraph`, and forcing the hardscape plan through them is unsafe.
  // The localStorage cache fully covers reload-safety for hardscape.
  useEffect(() => {
    if (plan) saveHardscapePlan(projectId, plan);
  }, [plan, projectId]);

  const cost = useMemo(() => (plan ? estimateCost(plan) : null), [plan]);

  function continueToPackage() {
    // Carry the cost estimate forward so the packaging stage can anchor the
    // deposit figure to the real layout estimate.
    if (cost) {
      try {
        localStorage.setItem(
          "atelier:hardscape:estimate",
          JSON.stringify(cost),
        );
      } catch {
        // best-effort — packaging degrades to its default copy
      }
    }
    const params = new URLSearchParams({ type: "hardscape" });
    if (projectId) params.set("projectId", projectId);
    router.push(`/builder/package?${params.toString()}`);
  }

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      } as const);

  if (hasBrief === null || !plan) {
    return <BuilderShell current="floor-plan" projectType="hardscape">{null}</BuilderShell>;
  }

  return (
    <BuilderShell current="floor-plan" projectType="hardscape">
      <motion.div {...reveal} className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <Layers className="size-3.5 text-copper" />
            Step 2 · Layout
          </span>
          <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
            Your backyard layout is taking shape
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Atelier laid out every surface from the brief, sized each one, and
            priced the job. Review the site plan and the estimate, then
            continue.
          </p>
          {!hasBrief && (
            <p className="mt-3 text-xs text-copper-bright">
              No brief found — showing a sample layout.{" "}
              <Link
                href="/builder/brief?type=hardscape"
                className="underline underline-offset-4"
              >
                Spec the backyard
              </Link>{" "}
              to draw your own.
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div
            className="flex flex-col rounded-card border border-border bg-surface p-5"
            data-tour="plan"
          >
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

          <div className="flex flex-col gap-5">
            <ElementsCard plan={plan} />
            {cost && <CostCard cost={cost} totalAreaSqft={plan.totalAreaSqft} />}

            <div className="rounded-card border border-border bg-surface p-5">
              <Button
                onClick={continueToPackage}
                size="lg"
                className="w-full"
              >
                Package the project <ArrowRight className="size-4" />
              </Button>
              <p className="mt-2 text-center text-xs text-muted-2">
                Bundle the layout, the estimate, and the client close into one
                deliverable.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      <GuidedTour route="floor-plan" />
    </BuilderShell>
  );
}

/** Element list with per-element area and the plan total. */
function ElementsCard({ plan }: { plan: HardscapePlan }) {
  return (
    <aside className="h-fit rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Ruler className="size-4 text-copper" />
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

      <div className="mt-1 flex items-center justify-between border-t border-border-bright pt-3">
        <span className="text-sm font-medium text-foreground">Total area</span>
        <span className="font-display text-lg tracking-tight text-copper-bright">
          {Math.round(plan.totalAreaSqft).toLocaleString()} ft²
        </span>
      </div>
    </aside>
  );
}

/** Low–high cost estimate from the hardscape cost model. */
function CostCard({
  cost,
  totalAreaSqft,
}: {
  cost: { lowCents: number; highCents: number };
  totalAreaSqft: number;
}) {
  return (
    <aside className="h-fit rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-sage" />
        <h2 className="text-sm font-medium text-foreground">Cost estimate</h2>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-2">
          Installed
        </span>
      </div>

      <p className="mt-3 font-display text-2xl tracking-tight text-copper-bright">
        {formatCents(cost.lowCents)} – {formatCents(cost.highCents)}
      </p>
      <p className="mt-1 text-xs text-muted-2">
        Ballpark installed cost across {Math.round(totalAreaSqft).toLocaleString()}{" "}
        ft² — material and labor, by surface material.
      </p>

      <p className="mt-3 rounded-lg border border-border bg-ink-2 p-3 text-[11px] leading-relaxed text-muted-2">
        A planning range, not a bid. A real estimate localizes by region,
        thickness, sub-base, and site access.
      </p>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Home floor-plan step (original flow — unchanged behaviour)                 */
/* -------------------------------------------------------------------------- */

function FloorPlanStep() {
  const [parsed, setParsed] = useState<ParsedRequirements | null>(null);
  // A stored/cached plan-graph, when one is restored from persistence.
  const [storedGraph, setStoredGraph] = useState<PlanGraph | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<ViewMode>("2d");
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();

  const projectId = searchParams.get("projectId");

  useEffect(() => {
    let cancelled = false;

    // Prefer the locally cached graph — keyless reload-safety.
    let cachedGraph: PlanGraph | null = null;
    try {
      const rawCache = localStorage.getItem(planCacheKey(projectId));
      if (rawCache) {
        const candidate: unknown = JSON.parse(rawCache);
        if (isPlanGraph(candidate)) cachedGraph = candidate;
      }
    } catch {
      // ignore corrupt cache
    }

    try {
      const raw = localStorage.getItem("atelier:parsed");
      if (raw) setParsed(JSON.parse(raw) as ParsedRequirements);
    } catch {
      // ignore corrupt storage
    }

    if (cachedGraph) {
      setStoredGraph(cachedGraph);
      setLoaded(true);
    }

    // With a projectId, try the server's stored plan. Any failure degrades
    // silently to the cached / client-generated path below.
    if (projectId) {
      fetch(`/api/builder/plan?projectId=${encodeURIComponent(projectId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { planGraph?: unknown } | null) => {
          if (cancelled) return;
          if (data && isPlanGraph(data.planGraph)) {
            setStoredGraph(data.planGraph);
            try {
              localStorage.setItem(
                planCacheKey(projectId),
                JSON.stringify(data.planGraph),
              );
            } catch {
              // ignore quota / serialization failures
            }
          }
        })
        .catch(() => {
          // network failure — keep the client-side fallback
        })
        .finally(() => {
          if (!cancelled) setLoaded(true);
        });
    } else if (!cachedGraph) {
      setLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Adapt the brief → kernel ParsedBrief → PlanGraph, then run the code check.
  // A restored/cached graph takes precedence over regenerating from the brief.
  // Memoized so the plan only recomputes when its inputs change.
  const plan = useMemo(() => {
    const graph = storedGraph
      ? storedGraph
      : parsed
        ? generatePlan(toParsedBrief(parsed), PLAN_SEED)
        : null;
    if (!graph) return null;
    return { graph, violations: validatePlan(graph) };
  }, [parsed, storedGraph]);

  // Persist a freshly generated plan — fire-and-forget. This never blocks or
  // fails the UI; every DB/network error degrades to the localStorage cache.
  useEffect(() => {
    if (storedGraph || !plan) return;
    try {
      localStorage.setItem(
        planCacheKey(projectId),
        JSON.stringify(plan.graph),
      );
    } catch {
      // ignore quota / serialization failures
    }
    if (!projectId) return;
    void fetch("/api/builder/plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, planGraph: plan.graph }),
    }).catch(() => {
      // persistence is best-effort — the cache already covers reloads
    });
  }, [plan, storedGraph, projectId]);

  if (loaded && !parsed && !storedGraph) {
    return (
      <BuilderShell current="floor-plan">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-2xl tracking-tight">No brief yet</h1>
          <p className="mt-2 text-sm text-muted">
            Describe the home first and Atelier will draft the floor plan from
            it.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/builder/brief">
              Start the brief <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </BuilderShell>
    );
  }

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      } as const);

  return (
    <BuilderShell current="floor-plan">
      <motion.div {...reveal} className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <Compass className="size-3.5 text-copper" />
            Step 2 · Floor plan
          </span>
          <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
            Your floor plan is taking shape
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Atelier read the brief into a structured program, packed it into a
            real plan, and checked it against the residential code. Review it,
            then continue to site the home on the lot.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          {parsed && <ProgramCard parsed={parsed} />}

          <div
            className="flex flex-col rounded-card border border-border bg-surface p-5"
            data-tour="plan"
          >
            {plan && (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-medium text-foreground">
                    Generated plan
                  </h2>
                  <ViewToggle view={view} onChange={setView} />
                </div>

                {view === "2d" ? (
                  <PlanCanvas
                    graph={plan.graph}
                    violations={plan.violations}
                  />
                ) : (
                  <Viewport3D graph={plan.graph} />
                )}

                <CodeCheckPanel violations={plan.violations} />

                <p className="mt-3 text-xs text-muted-2">
                  Generated by the v2 floor-plan kernel from your brief. The
                  drag-editable canvas is the next milestone — see{" "}
                  <code className="text-muted">docs/v2-spec.md</code>.
                </p>
              </>
            )}

            <Button
              onClick={() => {
                const params = new URLSearchParams();
                if (projectId) params.set("projectId", projectId);
                const qs = params.toString();
                router.push(`/builder/package${qs ? `?${qs}` : ""}`);
              }}
              size="lg"
              className="mt-5"
            >
              Package the project <ArrowRight className="size-4" />
            </Button>
            <p className="mt-2 text-center text-xs text-muted-2">
              Bundle the plan, the numbers, and the client close into one
              deliverable.
            </p>
          </div>
        </div>
      </motion.div>
      <GuidedTour route="floor-plan" />
    </BuilderShell>
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
/* Code-check panel                                                           */
/* -------------------------------------------------------------------------- */

function CodeCheckPanel({ violations }: { violations: CodeViolation[] }) {
  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");
  const clean = violations.length === 0;

  return (
    <div className="mt-4 rounded-card border border-border bg-ink-2 p-4">
      <div className="flex items-center gap-2">
        {clean ? (
          <CheckCircle2 className="size-4 text-sage" />
        ) : (
          <AlertTriangle className="size-4 text-[#e0654b]" />
        )}
        <h3 className="text-sm font-medium text-foreground">Code check</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-2">
          IRC residential
        </span>
      </div>

      {clean ? (
        <p className="mt-2 text-xs text-muted">
          No violations — the generated plan meets the checked IRC rules for
          egress, room sizing, ceiling height, and door clearance.
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted">
            {errors.length} {errors.length === 1 ? "error" : "errors"}
            {warnings.length > 0
              ? ` · ${warnings.length} ${
                  warnings.length === 1 ? "warning" : "warnings"
                }`
              : ""}
            .
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {violations.map((v, i) => (
              <li
                key={`${v.ruleId}-${v.objectId}-${i}`}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                      v.severity === "error"
                        ? "bg-[#e0654b]/15 text-[#f0917c]"
                        : "bg-copper/15 text-copper-bright"
                    }`}
                  >
                    {v.severity}
                  </span>
                  <span className="font-mono text-[10px] text-muted-2">
                    {v.ruleId}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-foreground">{v.message}</p>
                <p className="mt-1 text-xs text-muted-2">{v.suggestion}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Parsed-program card                                                        */
/* -------------------------------------------------------------------------- */

function ProgramCard({ parsed }: { parsed: ParsedRequirements }) {
  const stats = [
    { label: "Finished area", value: `${parsed.sqft.toLocaleString()} ft²` },
    { label: "Bedrooms", value: String(parsed.beds) },
    { label: "Bathrooms", value: String(parsed.baths) },
    {
      label: "Stories",
      value:
        parsed.story_count === 1
          ? "Single story"
          : `${parsed.story_count} stories`,
    },
  ];

  return (
    <aside className="h-fit rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Ruler className="size-4 text-copper" />
        <h2 className="text-sm font-medium text-foreground">Parsed program</h2>
      </div>

      <p className="mt-3 font-display text-xl tracking-tight text-copper-bright">
        {titleCase(parsed.style)}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-2 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-muted-2">
              {s.label}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-2">Lot</span>
        <span className="font-medium text-foreground">{parsed.lot_size}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-2">Code basis</span>
        <span className="font-medium text-foreground">
          {parsed.code_jurisdiction_hint}
        </span>
      </div>

      {parsed.must_haves.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-2">
            Must-haves
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {parsed.must_haves.map((m) => (
              <span
                key={m}
                className="rounded-full border border-copper/30 bg-copper/10 px-2.5 py-1 text-xs text-copper-bright"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
