"use client";

/**
 * ProjectPackage — the three-lens deliverable surface for the packaging stage.
 *
 * Renders one finished project through three audience tabs (client /
 * contractor / architect). Each view is composed per project type:
 *
 *  - Client     → ClientView    (AI render seam + vision + close)
 *  - Contractor → ContractorView (layout/plan + line-item estimate / takeoff)
 *  - Architect  → ArchitectView  (dimensioned layout/plan + export deliverables)
 *
 * Tabs are the Radix-backed `components/ui/tabs` primitive, so roles and
 * keyboard navigation (arrow keys, Home/End) come for free and accessibly.
 */
import { useMemo, useState } from "react";
import { Building2, HardHat, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ParsedRequirements } from "@/lib/builder";
import type { ProjectType } from "@/lib/db/types";
import { estimateCost } from "@/lib/hardscape/cost";
import type { HardscapePlan } from "@/lib/hardscape/types";
import type { PlanGraph } from "@/lib/kernel/types";
import type { SitePhoto } from "@/lib/site-photo";
import {
  hardscapeDeposit,
  homePricing,
  loadHardscapeEstimate,
  type DepositFigure,
} from "@/lib/package";
import { ClientView } from "./package/ClientView";
import { ContractorView } from "./package/ContractorView";
import { ArchitectView } from "./package/ArchitectView";

export interface ProjectPackageProps {
  projectType: ProjectType;
  projectId: string | null;
  /** Home plan-graph, when the home flow produced one. */
  homePlan: PlanGraph | null;
  /** Parsed home program, when one is cached. */
  parsed: ParsedRequirements | null;
  /** Raw home brief text, when one is cached. */
  homeBrief: string | null;
  /** Hardscape plan, always present for a hardscape project. */
  hardscapePlan: HardscapePlan | null;
  /** Captured site photo, when one is stored for this project. */
  photo: SitePhoto | null;
}

type TabKey = "client" | "contractor" | "architect";

const TABS: { key: TabKey; label: string; icon: typeof Users; hint: string }[] =
  [
    { key: "client", label: "Client", icon: Users, hint: "The pitch & close" },
    {
      key: "contractor",
      label: "Contractor",
      icon: HardHat,
      hint: "The working numbers",
    },
    {
      key: "architect",
      label: "Architect",
      icon: Building2,
      hint: "The technical set",
    },
  ];

export function ProjectPackage({
  projectType,
  projectId,
  homePlan,
  parsed,
  homeBrief,
  hardscapePlan,
  photo,
}: ProjectPackageProps) {
  const [tab, setTab] = useState<TabKey>("client");

  const isHardscape = projectType === "hardscape";

  // Estimate + deposit are derived once and shared across all three views so
  // the figure the client approves matches the contractor's takeoff exactly.
  const hardscapeCost = useMemo(
    () => (hardscapePlan ? estimateCost(hardscapePlan) : null),
    [hardscapePlan],
  );

  const deposit: DepositFigure = useMemo(() => {
    if (isHardscape) {
      // Prefer the cost just computed from the plan; fall back to the value
      // the layout step cached so the figure survives even a stale plan.
      const estimate = hardscapeCost ?? loadHardscapeEstimate();
      return hardscapeDeposit(estimate);
    }
    const pricing = homePricing(parsed);
    // For a home, the "deposit" is the design fee that funds the permit set.
    return {
      depositCents: pricing.totalCents,
      projectValueCents: pricing.totalCents,
      fraction: 1,
      anchored: parsed !== null,
    };
  }, [isHardscape, hardscapeCost, parsed]);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as TabKey)}
      className="flex flex-col gap-6"
    >
      <div className="flex justify-center">
        <TabsList aria-label="Deliverable audience">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.key} value={t.key} className="gap-2">
                <Icon className="size-4" aria-hidden="true" />
                <span className="flex flex-col items-start leading-tight sm:flex-row sm:items-center sm:gap-1.5">
                  <span>{t.label}</span>
                  <span className="hidden text-[10px] font-normal text-current/70 sm:inline">
                    · {t.hint}
                  </span>
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <TabsContent value="client">
        <ClientView
          projectType={projectType}
          projectId={projectId}
          homePlan={homePlan}
          parsed={parsed}
          homeBrief={homeBrief}
          hardscapePlan={hardscapePlan}
          photo={photo}
          deposit={deposit}
        />
      </TabsContent>

      <TabsContent value="contractor">
        <ContractorView
          projectType={projectType}
          homePlan={homePlan}
          parsed={parsed}
          hardscapePlan={hardscapePlan}
          hardscapeCost={hardscapeCost}
          deposit={deposit}
        />
      </TabsContent>

      <TabsContent value="architect">
        <ArchitectView
          projectType={projectType}
          homePlan={homePlan}
          parsed={parsed}
          hardscapePlan={hardscapePlan}
        />
      </TabsContent>
    </Tabs>
  );
}
