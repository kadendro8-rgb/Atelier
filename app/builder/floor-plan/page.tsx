"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Compass,
  Ruler,
  Square,
} from "lucide-react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { PlanCanvas } from "@/components/builder/PlanCanvas";
import { Button } from "@/components/ui/button";
import type { ParsedRequirements } from "@/lib/builder";
import { toParsedBrief } from "@/lib/kernel/adapt";
import { validatePlan, type CodeViolation } from "@/lib/kernel/codeCheck";
import { generatePlan } from "@/lib/kernel/plan";

// Three.js is client-only — load the 3D viewport without SSR.
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

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// DECISION: a fixed kernel seed keeps the generated plan stable across renders
// and reloads for a given brief — the spec mandates deterministic output, and
// re-rolling the layout on every visit would be jarring. A future "regenerate"
// control can vary this.
const PLAN_SEED = 1;

type ViewMode = "2d" | "3d";

export default function FloorPlanPage() {
  const [parsed, setParsed] = useState<ParsedRequirements | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<ViewMode>("2d");
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("atelier:parsed");
      if (raw) setParsed(JSON.parse(raw) as ParsedRequirements);
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);

  // Adapt the brief → kernel ParsedBrief → PlanGraph, then run the code check.
  // Memoized on the parsed brief so the plan only regenerates when it changes.
  const plan = useMemo(() => {
    if (!parsed) return null;
    const brief = toParsedBrief(parsed);
    const graph = generatePlan(brief, PLAN_SEED);
    const violations = validatePlan(graph);
    return { graph, violations };
  }, [parsed]);

  if (loaded && !parsed) {
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

          <div className="flex flex-col rounded-card border border-border bg-surface p-5">
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
              onClick={() => router.push("/#pricing")}
              size="lg"
              className="mt-5"
            >
              Continue to pricing <ArrowRight className="size-4" />
            </Button>
            <p className="mt-2 text-center text-xs text-muted-2">
              That&apos;s the interactive demo — see plans and pricing to keep
              building.
            </p>
          </div>
        </div>
      </motion.div>
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
