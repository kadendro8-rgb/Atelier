"use client";

/**
 * ArchitectView — the technical set.
 *
 * Shows the dimensioned layout/plan and the list of exportable deliverable
 * formats. Every format here is honest about what it produces:
 *
 *  - SVG  — serializes the rendered plan SVG; a real `.svg` file.
 *  - DXF  — AutoCAD R12 ASCII DXF via `lib/io` (`exportDWG` for home,
 *           `exportHardscapeDXF` for hardscape). Opens in AutoCAD and every
 *           major CAD tool. Listed as DXF, not "DWG": true binary DWG needs
 *           the commercial ODA SDK and ships with the desktop product
 *           (see docs/atelier-desktop.md §3).
 *  - PDF  — print-ready sheet, rasterized from the plan SVG via `exportPlanPdf`.
 *  - IFC  — IFC4 STEP model via `exportIFC4`; home only. Hardscape IFC stays
 *           honestly badged "coming soon" — the IFC writer models walls and a
 *           slab, which an exterior site layout has neither of.
 *
 * Every export is keyless and runs entirely client-side.
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
import { downloadBlob } from "@/lib/io/download";
import { exportDWG } from "@/lib/io/dwg";
import { exportHardscapeDXF } from "@/lib/io/hardscapeDxf";
import { exportIFC4 } from "@/lib/io/ifc4";
import { exportPlanPdf } from "@/lib/io/planPdf";
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

/** Which export a deliverable row produces. */
type FormatId = "svg" | "dxf" | "pdf" | "ifc";

/** One deliverable format in the export set. */
interface DeliverableFormat {
  id: FormatId;
  /** Short badge text shown in the row's square chip. */
  badge: string;
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
          badge: "svg",
          label: "Site plan — SVG",
          description: "Vector site layout, dimensioned. Downloads now.",
          status: "ready",
        },
        {
          id: "pdf",
          badge: "pdf",
          label: "Site plan — PDF",
          description: "Print-ready sheet with title block. Downloads now.",
          status: "ready",
        },
        {
          id: "dxf",
          badge: "dxf",
          label: "CAD set — DXF",
          description:
            "Editable CAD geometry — opens in AutoCAD and every major CAD tool.",
          status: "ready",
        },
        {
          id: "ifc",
          badge: "ifc",
          label: "BIM model — IFC",
          description:
            "Open-BIM export targets enclosed buildings; not applicable to a site layout.",
          status: "planned",
        },
      ]
    : [
        {
          id: "svg",
          badge: "svg",
          label: "Floor plan — SVG",
          description: "Vector floor plan, to scale. Downloads now.",
          status: "ready",
        },
        {
          id: "pdf",
          badge: "pdf",
          label: "Plan set — PDF",
          description: "Print-ready sheet with title block. Downloads now.",
          status: "ready",
        },
        {
          id: "dxf",
          badge: "dxf",
          label: "CAD set — DXF",
          description:
            "Editable CAD geometry on AIA layers — opens in AutoCAD and every major CAD tool.",
          status: "ready",
        },
        {
          id: "ifc",
          badge: "ifc",
          label: "BIM model — IFC",
          description: "IFC4 open-BIM model for coordination and clash checks.",
          status: "ready",
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

        {!isHardscape && homePlan && <CodeNote plan={homePlan} />}
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
          hasPlan={hasPlan}
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
 * by the export handlers so the SVG / PDF downloads are the *actual* drawn
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
    <p className={cn("mt-3 text-xs", clean ? "text-sage" : "text-copper-bright")}>
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
  hasPlan,
  homePlan,
  hardscapePlan,
  parsed,
}: {
  formats: DeliverableFormat[];
  isHardscape: boolean;
  hasPlan: boolean;
  homePlan: PlanGraph | null;
  hardscapePlan: HardscapePlan | null;
  parsed: ParsedRequirements | null;
}) {
  const [done, setDone] = useState<FormatId | null>(null);
  const [busy, setBusy] = useState<FormatId | null>(null);
  // A guard so a double-click doesn't fire two downloads.
  const busyRef = useRef(false);

  /** Read the plan SVG genuinely on the page, for SVG / PDF exports. */
  function planSvg(): SVGSVGElement | null {
    const host = document.getElementById("package-plan-sheet");
    return host?.querySelector("svg") ?? null;
  }

  /**
   * Run one export. Each branch produces a genuine file: the SVG is the drawn
   * sheet serialized; DXF/IFC are real CAD/BIM text from `lib/io`; PDF is a
   * rasterized print sheet. Best-effort — a locked-down browser simply shows
   * no confirmation.
   */
  async function runExport(id: FormatId) {
    if (busyRef.current || !hasPlan) return;
    busyRef.current = true;
    setBusy(id);
    setDone(null);

    try {
      const base = exportBaseName(isHardscape, parsed, homePlan, hardscapePlan);

      if (id === "svg") {
        const svg = planSvg();
        if (!svg) return;
        const clone = svg.cloneNode(true) as SVGSVGElement;
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const serialized = new XMLSerializer().serializeToString(clone);
        downloadBlob(
          `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`,
          `${base}.svg`,
          "image/svg+xml",
        );
        setDone("svg");
        return;
      }

      if (id === "dxf") {
        const dxf =
          isHardscape && hardscapePlan
            ? exportHardscapeDXF(hardscapePlan)
            : homePlan
              ? exportDWG(homePlan)
              : null;
        if (!dxf) return;
        downloadBlob(dxf, `${base}.dxf`, "image/vnd.dxf");
        setDone("dxf");
        return;
      }

      if (id === "ifc") {
        // Honest guard: the IFC writer is home-only. Hardscape IFC is a
        // "coming soon" badge and never reaches this branch.
        if (isHardscape || !homePlan) return;
        const ifc = exportIFC4(homePlan);
        downloadBlob(ifc, `${base}.ifc`, "application/x-step");
        setDone("ifc");
        return;
      }

      if (id === "pdf") {
        const svg = planSvg();
        if (!svg) return;
        const pdf = await exportPlanPdf(svg, {
          title: isHardscape
            ? "Dimensioned Site Layout"
            : "Dimensioned Floor Plan",
          subtitle: pdfSubtitle(isHardscape, parsed, homePlan, hardscapePlan),
        });
        if (!pdf) return;
        downloadBlob(pdf, `${base}.pdf`, "application/pdf");
        setDone("pdf");
        return;
      }
    } catch {
      // Best-effort — a locked-down browser simply shows no confirmation.
    } finally {
      setBusy(null);
      busyRef.current = false;
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-copper" />
        <h2 className="text-sm font-medium text-foreground">Deliverable set</h2>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-2">
          Exports
        </span>
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-border">
        {formats.map((f) => {
          const isReady = f.status === "ready";
          const isBusy = busy === f.id;
          return (
            <li key={f.id} className="flex items-start gap-3 py-3">
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border text-[10px] font-semibold uppercase",
                  isReady
                    ? "border-sage/40 bg-sage/15 text-sage"
                    : "border-border bg-surface-2 text-muted-2",
                )}
              >
                {f.badge}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                  {f.label}
                  {!isReady && (
                    <span className="rounded-full border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-2">
                      Coming soon
                    </span>
                  )}
                  {isReady && done === f.id && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-sage">
                      <Check className="size-3" /> Downloaded
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-2">
                  {f.description}
                </p>
              </div>
              {isReady && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={!hasPlan || busy !== null}
                  onClick={() => void runExport(f.id)}
                  aria-label={`Download ${f.label}`}
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  {isBusy ? "Preparing" : "Download"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-2">
        Every export runs in your browser — no upload, no account. DXF opens in
        AutoCAD and every major CAD tool; native binary DWG ships with the
        Atelier desktop app.
      </p>
    </div>
  );
}

/** Build a clean, descriptive file-name stem (no extension) for an export. */
function exportBaseName(
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
  return `${base}${tag}`;
}

/** A one-line PDF subtitle describing the plan. */
function pdfSubtitle(
  isHardscape: boolean,
  parsed: ParsedRequirements | null,
  homePlan: PlanGraph | null,
  hardscapePlan: HardscapePlan | null,
): string {
  if (isHardscape && hardscapePlan) {
    const w = Math.round(hardscapePlan.bounds.width / MM_PER_FT);
    const h = Math.round(hardscapePlan.bounds.height / MM_PER_FT);
    return `${w}′ × ${h}′ site · ${hardscapePlan.elements.length} placed elements`;
  }
  if (!isHardscape && homePlan) {
    const style = parsed ? `${parsed.style} · ` : "";
    return `${style}${homePlan.rooms.length} rooms · ${homePlan.level}`;
  }
  return "Atelier deliverable set";
}
