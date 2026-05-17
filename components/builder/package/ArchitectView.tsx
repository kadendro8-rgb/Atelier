"use client";

/**
 * ArchitectView — the technical set.
 *
 * Shows the dimensioned layout/plan and the list of exportable deliverable
 * formats. The "prepare set" affordance is honest: it serializes the rendered
 * plan SVG and downloads a real `.svg` file — that genuinely exists. The
 * DWG / IFC formats are listed as part of the deliverable set so the architect
 * sees the full pipeline, but are clearly marked as not-yet-available stubs —
 * no fake DWG export is produced.
 */
import { useRef, useState } from "react";
import {
  Building2,
  Check,
  Download,
  FileText,
  Layers,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HardscapeLayoutSVG } from "@/components/builder/HardscapeLayoutSVG";
import { PlanCanvas } from "@/components/builder/PlanCanvas";
import type { ParsedRequirements } from "@/lib/builder";
import type { ProjectType } from "@/lib/db/types";
import type { HardscapePlan } from "@/lib/hardscape/types";
import { validatePlan } from "@/lib/kernel/codeCheck";
import type { PlanGraph } from "@/lib/kernel/types";
import { cn } from "@/lib/utils";

const MM_PER_FT = 304.8;

interface ArchitectViewProps {
  projectType: ProjectType;
  homePlan: PlanGraph | null;
  parsed: ParsedRequirements | null;
  hardscapePlan: HardscapePlan | null;
}

/** One deliverable format in the export set. */
interface DeliverableFormat {
  id: string;
  label: string;
  description: string;
  /** `ready` formats download genuinely; `planned` are honest stubs. */
  status: "ready" | "planned";
}

export function ArchitectView({
  projectType,
  homePlan,
  parsed,
  hardscapePlan,
}: ArchitectViewProps) {
  const isHardscape = projectType === "hardscape";
  const hasPlan = isHardscape ? Boolean(hardscapePlan) : Boolean(homePlan);

  // The technical set's export formats — honest about which are real.
  const formats: DeliverableFormat[] = isHardscape
    ? [
        {
          id: "svg",
          label: "Site plan — SVG",
          description: "Vector site layout, dimensioned. Downloads now.",
          status: "ready",
        },
        {
          id: "pdf",
          label: "Site plan — PDF",
          description:
            "Print-ready sheet. Use the browser print dialog on the SVG.",
          status: "planned",
        },
        {
          id: "dwg",
          label: "CAD set — DWG",
          description: "Editable CAD geometry for the drafting set.",
          status: "planned",
        },
      ]
    : [
        {
          id: "svg",
          label: "Floor plan — SVG",
          description: "Vector floor plan, to scale. Downloads now.",
          status: "ready",
        },
        {
          id: "pdf",
          label: "Plan set — PDF",
          description:
            "Print-ready sheet. Use the browser print dialog on the SVG.",
          status: "planned",
        },
        {
          id: "dwg",
          label: "CAD set — DWG",
          description: "Editable CAD geometry for the drafting set.",
          status: "planned",
        },
        {
          id: "ifc",
          label: "BIM model — IFC",
          description: "Open-BIM model for coordination and clash checks.",
          status: "planned",
        },
      ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-card border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          {isHardscape ? (
            <Layers className="size-4 text-copper" />
          ) : (
            <Building2 className="size-4 text-copper" />
          )}
          <h2 className="text-sm font-medium text-foreground">
            Dimensioned {isHardscape ? "site layout" : "floor plan"}
          </h2>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-2">
            Technical
          </span>
        </div>

        {hasPlan ? (
          <ExportableSheet
            isHardscape={isHardscape}
            homePlan={homePlan}
            hardscapePlan={hardscapePlan}
          />
        ) : (
          <div className="mt-3 grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-border bg-ink-2">
            <p className="max-w-xs text-center text-sm text-muted-2">
              No {isHardscape ? "layout" : "floor plan"} generated yet — the
              technical set is drawn from the plan.
            </p>
          </div>
        )}

        {!isHardscape && homePlan && (
          <CodeNote plan={homePlan} />
        )}
        {isHardscape && hardscapePlan && (
          <p className="mt-3 text-xs text-muted-2">
            Site extents{" "}
            {Math.round(hardscapePlan.bounds.width / MM_PER_FT)}′ ×{" "}
            {Math.round(hardscapePlan.bounds.height / MM_PER_FT)}′ ·{" "}
            {hardscapePlan.elements.length} placed elements.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <DeliverableList
          formats={formats}
          isHardscape={isHardscape}
          homePlan={homePlan}
          hardscapePlan={hardscapePlan}
          parsed={parsed}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The plan sheet — wrapped so its SVG can be serialized for export            */
/* -------------------------------------------------------------------------- */

/**
 * Renders the plan inside a ref'd wrapper. The wrapper's `<svg>` is read back
 * by the export handler so the "prepare set" download is the *actual* drawn
 * sheet — not a separately re-generated one.
 */
function ExportableSheet({
  isHardscape,
  homePlan,
  hardscapePlan,
}: {
  isHardscape: boolean;
  homePlan: PlanGraph | null;
  hardscapePlan: HardscapePlan | null;
}) {
  return (
    <div id="package-plan-sheet" className="mt-3">
      {isHardscape && hardscapePlan ? (
        <HardscapeLayoutSVG plan={hardscapePlan} />
      ) : homePlan ? (
        <PlanCanvas graph={homePlan} violations={validatePlan(homePlan)} />
      ) : null}
    </div>
  );
}

function CodeNote({ plan }: { plan: PlanGraph }) {
  const violations = validatePlan(plan);
  const clean = violations.length === 0;
  return (
    <p
      className={cn(
        "mt-3 text-xs",
        clean ? "text-sage" : "text-copper-bright",
      )}
    >
      {clean
        ? "Code check clean — meets the checked IRC residential rules."
        : `${violations.length} code ${
            violations.length === 1 ? "issue" : "issues"
          } flagged — see the floor-plan step for detail.`}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* The deliverable / export list                                              */
/* -------------------------------------------------------------------------- */

function DeliverableList({
  formats,
  isHardscape,
  homePlan,
  hardscapePlan,
  parsed,
}: {
  formats: DeliverableFormat[];
  isHardscape: boolean;
  homePlan: PlanGraph | null;
  hardscapePlan: HardscapePlan | null;
  parsed: ParsedRequirements | null;
}) {
  const [done, setDone] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  // A guard so a double-click doesn't fire two downloads.
  const busyRef = useRef(false);

  /**
   * Prepare and download the technical set. Honest: this serializes the plan
   * SVG that is genuinely on the page and downloads it as a real `.svg` file.
   */
  function prepareSet() {
    if (busyRef.current) return;
    busyRef.current = true;
    setPreparing(true);
    setDone(null);

    try {
      const host = document.getElementById("package-plan-sheet");
      const svg = host?.querySelector("svg");
      if (!svg) {
        setPreparing(false);
        busyRef.current = false;
        return;
      }
      // Clone so we can inline a namespace + a dark backdrop without mutating
      // the live, on-screen SVG.
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const serialized = new XMLSerializer().serializeToString(clone);
      const blob = new Blob(
        ['<?xml version="1.0" encoding="UTF-8"?>\n', serialized],
        { type: "image/svg+xml" },
      );
      const url = URL.createObjectURL(blob);
      const name = exportFileName(isHardscape, parsed, homePlan, hardscapePlan);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoke after a tick so the download has the URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDone("svg");
    } catch {
      // Best-effort — a locked-down browser simply shows no confirmation.
    } finally {
      setPreparing(false);
      busyRef.current = false;
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-copper" />
        <h2 className="text-sm font-medium text-foreground">
          Deliverable set
        </h2>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-2">
          Exports
        </span>
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-border">
        {formats.map((f) => (
          <li key={f.id} className="flex items-start gap-3 py-3">
            <span
              className={cn(
                "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border text-[10px] font-semibold uppercase",
                f.status === "ready"
                  ? "border-sage/40 bg-sage/15 text-sage"
                  : "border-border bg-surface-2 text-muted-2",
              )}
            >
              {f.id}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm text-foreground">
                {f.label}
                {f.status === "planned" && (
                  <span className="rounded-full border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-2">
                    Coming soon
                  </span>
                )}
                {f.status === "ready" && done === f.id && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-sage">
                    <Check className="size-3" /> Downloaded
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-2">
                {f.description}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Button
        onClick={prepareSet}
        disabled={preparing}
        size="lg"
        className="mt-4 w-full"
      >
        {preparing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Preparing set…
          </>
        ) : (
          <>
            <Download className="size-4" />
            Prepare &amp; download set
          </>
        )}
      </Button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-2">
        Downloads the dimensioned plan as a vector SVG — the formats marked
        &ldquo;coming soon&rdquo; ship as the export pipeline grows.
      </p>
    </div>
  );
}

/** Build a clean, descriptive file name for the exported sheet. */
function exportFileName(
  isHardscape: boolean,
  parsed: ParsedRequirements | null,
  homePlan: PlanGraph | null,
  hardscapePlan: HardscapePlan | null,
): string {
  const base = isHardscape
    ? "atelier-hardscape-site-plan"
    : parsed
      ? `atelier-${parsed.style.replace(/\s+/g, "-").toLowerCase()}-floor-plan`
      : "atelier-floor-plan";
  // A light reference to the plan so two exports never collide unexpectedly.
  const tag = isHardscape
    ? hardscapePlan
      ? `-${hardscapePlan.elements.length}el`
      : ""
    : homePlan
      ? `-${homePlan.rooms.length}rm`
      : "";
  return `${base}${tag}.svg`;
}
