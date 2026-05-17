"use client";

/**
 * Step 3 — "Deliver" — the builder's final, packaging stage.
 *
 * Presents the finished project as a polished, shippable deliverable across
 * three audience lenses, in one cohesive stage:
 *
 *  - Client     — the emotional sell + the close: the AI render surface, the
 *                 design vision, headline numbers, and "Approve & pay deposit".
 *  - Contractor — the working numbers: the layout/plan, the line-item estimate
 *                 and material/area takeoff.
 *  - Architect  — the technical set: the dimensioned layout/plan and the list
 *                 of exportable deliverable formats.
 *
 * Same project, three lenses. The stage works for both `home` and `hardscape`
 * project types, is keyless and reload-safe (reads the cached brief / plan /
 * estimate plus the IndexedDB site photo), and degrades gracefully on every
 * missing input — no project, no photo, no Stripe — never dead-ending.
 */
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { PackageCheck } from "lucide-react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { GuidedTour } from "@/components/builder/GuidedTour";
import { ProjectPackage } from "@/components/builder/ProjectPackage";
import { PackageClose } from "@/components/builder/package/PackageClose";
import type { ParsedRequirements } from "@/lib/builder";
import type { ProjectType } from "@/lib/db/types";
import {
  defaultHardscapeBrief,
  loadHardscapeBrief,
  loadHardscapePlan,
  resolveProjectType,
} from "@/lib/hardscape/builder";
import { generateHardscape } from "@/lib/hardscape/generate";
import type { HardscapePlan } from "@/lib/hardscape/types";
import { toParsedBrief } from "@/lib/kernel/adapt";
import { generatePlan } from "@/lib/kernel/plan";
import type { PlanGraph } from "@/lib/kernel/types";
import type { SitePhoto } from "@/lib/site-photo";
import { loadSitePhoto } from "@/lib/site-photo";

const EASE = [0.16, 1, 0.3, 1] as const;

// A fixed kernel seed keeps the generated plan stable across reloads — the
// same brief always packages the same way. Matches the floor-plan step.
const PLAN_SEED = 1;

/** localStorage key for the keyless home plan-graph cache. */
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

export default function PackagePage() {
  return (
    <Suspense fallback={<BuilderShell current="package">{null}</BuilderShell>}>
      <PackageRouter />
    </Suspense>
  );
}

/**
 * Resolves the active project type and assembles the deliverable inputs from
 * the keyless caches, then hands them to the shared `ProjectPackage` view.
 */
function PackageRouter() {
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();

  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [homePlan, setHomePlan] = useState<PlanGraph | null>(null);
  const [parsed, setParsed] = useState<ParsedRequirements | null>(null);
  const [homeBrief, setHomeBrief] = useState<string | null>(null);
  const [hardscapePlan, setHardscapePlan] = useState<HardscapePlan | null>(
    null,
  );
  const [photo, setPhoto] = useState<SitePhoto | null>(null);
  const [ready, setReady] = useState(false);

  const projectId = searchParams.get("projectId");

  // Resolve the project type once the client is hydrated.
  useEffect(() => {
    setProjectType(resolveProjectType(searchParams.get("type")));
  }, [searchParams]);

  // Assemble the deliverable inputs from the keyless caches. Every read is
  // wrapped: a missing or corrupt cache degrades to a regenerated default so
  // a deep link into the packaging stage never dead-ends.
  useEffect(() => {
    if (projectType === null) return;

    if (projectType === "hardscape") {
      const cached = loadHardscapePlan(projectId);
      if (cached) {
        setHardscapePlan(cached);
      } else {
        // No cached plan — regenerate deterministically from the cached brief
        // (or the default brief) so the stage still has a real plan to show.
        const brief = loadHardscapeBrief() ?? defaultHardscapeBrief();
        setHardscapePlan(generateHardscape(brief, PLAN_SEED));
      }
    } else {
      // Home — prefer the cached plan-graph; otherwise regenerate from the
      // parsed brief; otherwise leave null and the view shows a graceful
      // "package without a plan" state.
      let parsedReq: ParsedRequirements | null = null;
      try {
        const rawParsed = window.localStorage.getItem("atelier:parsed");
        if (rawParsed) parsedReq = JSON.parse(rawParsed) as ParsedRequirements;
      } catch {
        // ignore corrupt storage
      }
      setParsed(parsedReq);

      try {
        const rawBrief = window.localStorage.getItem("atelier:brief");
        if (rawBrief) setHomeBrief(rawBrief);
      } catch {
        // ignore corrupt storage
      }

      let graph: PlanGraph | null = null;
      try {
        const rawCache = window.localStorage.getItem(planCacheKey(projectId));
        if (rawCache) {
          const candidate: unknown = JSON.parse(rawCache);
          if (isPlanGraph(candidate)) graph = candidate;
        }
      } catch {
        // ignore corrupt cache
      }
      if (!graph && parsedReq) {
        try {
          graph = generatePlan(toParsedBrief(parsedReq), PLAN_SEED);
        } catch {
          graph = null;
        }
      }
      setHomePlan(graph);
    }

    setReady(true);
  }, [projectType, projectId]);

  // Restore the captured site photo from IndexedDB — best-effort, non-blocking.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void loadSitePhoto(projectId).then((stored) => {
      if (!cancelled && stored) setPhoto(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (projectType === null || !ready) {
    return <BuilderShell current="package">{null}</BuilderShell>;
  }

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: EASE },
      } as const);

  return (
    <BuilderShell current="package" projectType={projectType}>
      <motion.div {...reveal} className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <PackageCheck className="size-3.5 text-copper" />
            Step 3 · Deliver
          </span>
          <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
            Your project, packaged to ship
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
            One finished project, three lenses — the client&apos;s pitch, the
            contractor&apos;s numbers, and the architect&apos;s set. Pick a view
            and deliver.
          </p>
        </div>

        <div className="mt-8" data-tour="package-audience">
          <ProjectPackage
            projectType={projectType}
            projectId={projectId}
            homePlan={homePlan}
            parsed={parsed}
            homeBrief={homeBrief}
            hardscapePlan={hardscapePlan}
            photo={photo}
          />
        </div>

        {/* The close — the demo's deliberate, satisfying finish. The package
            above is fully keyless; this is the one honest, opt-in ask. */}
        <div data-tour="package-close">
          <PackageClose projectType={projectType} />
        </div>
      </motion.div>
      <GuidedTour route="package" />
    </BuilderShell>
  );
}
