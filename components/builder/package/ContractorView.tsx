"use client";

/**
 * ContractorView — the working numbers.
 *
 * Shows the layout/plan plus the line-item estimate and material takeoff:
 *
 *  - hardscape → the site layout SVG, a per-element / per-area breakdown, and
 *                the installed-cost range from `lib/hardscape/cost`;
 *  - home      → the floor plan, the parsed program summary, and a
 *                room-by-zone area breakdown.
 */
import { useMemo, useState } from "react";
import { CheckCircle2, Download, HardHat, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HardscapeLayoutSVG } from "@/components/builder/HardscapeLayoutSVG";
import { PlanCanvas } from "@/components/builder/PlanCanvas";
import type { ParsedRequirements } from "@/lib/builder";
import type { ProjectType } from "@/lib/db/types";
import { materialInfo } from "@/lib/hardscape/builder";
import type { HardscapeCostEstimate } from "@/lib/hardscape/cost";
import type { HardscapeMaterial, HardscapePlan } from "@/lib/hardscape/types";
import { downloadBlob } from "@/lib/io/download";
import {
  exportHardscapeTakeoffCsv,
  exportHomeTakeoffCsv,
} from "@/lib/io/takeoffCsv";
import type { PlanGraph, RoomZone } from "@/lib/kernel/types";
import { formatUsdCents, type DepositFigure } from "@/lib/package";

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

interface ContractorViewProps {
  projectType: ProjectType;
  homePlan: PlanGraph | null;
  parsed: ParsedRequirements | null;
  hardscapePlan: HardscapePlan | null;
  hardscapeCost: HardscapeCostEstimate | null;
  deposit: DepositFigure;
}

export function ContractorView({
  projectType,
  homePlan,
  parsed,
  hardscapePlan,
  hardscapeCost,
  deposit,
}: ContractorViewProps) {
  if (projectType === "hardscape") {
    return (
      <HardscapeContractorView
        plan={hardscapePlan}
        cost={hardscapeCost}
        deposit={deposit}
      />
    );
  }
  return (
    <HomeContractorView plan={homePlan} parsed={parsed} deposit={deposit} />
  );
}

/* -------------------------------------------------------------------------- */
/* Hardscape — material takeoff + installed-cost estimate                      */
/* -------------------------------------------------------------------------- */

function HardscapeContractorView({
  plan,
  cost,
  deposit,
}: {
  plan: HardscapePlan | null;
  cost: HardscapeCostEstimate | null;
  deposit: DepositFigure;
}) {
  // Aggregate the plan into a per-material takeoff: total area per material.
  const takeoff = useMemo(() => {
    if (!plan) return [];
    const byMaterial = new Map<HardscapeMaterial, number>();
    for (const el of plan.elements) {
      byMaterial.set(
        el.material,
        (byMaterial.get(el.material) ?? 0) + el.areaSqft,
      );
    }
    return [...byMaterial.entries()]
      .map(([material, areaSqft]) => ({ material, areaSqft }))
      .sort((a, b) => b.areaSqft - a.areaSqft);
  }, [plan]);

  if (!plan) {
    return (
      <EmptyState message="No layout to take off yet — generate the backyard layout first." />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-card border border-border bg-surface p-5">
        <CardHead icon={Ruler} title="Site layout" note="2D site plan" />
        <div className="mt-3">
          <HardscapeLayoutSVG plan={plan} />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Line-item estimate. */}
        <div className="rounded-card border border-border bg-surface p-5">
          <CardHead
            icon={HardHat}
            title="Line-item estimate"
            note="Installed"
          />
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {plan.elements
              .filter((el) => el.kind !== "border")
              .map((el) => {
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
            <span className="text-sm font-medium text-foreground">
              Total area
            </span>
            <span className="font-display text-lg tracking-tight text-copper-bright">
              {Math.round(plan.totalAreaSqft).toLocaleString()} ft²
            </span>
          </div>

          {cost && (
            <div className="mt-4 rounded-lg border border-border bg-ink-2 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-2">
                Installed cost range
              </p>
              <p className="mt-1 font-display text-xl tracking-tight text-copper-bright">
                {formatUsdCents(cost.lowCents)} –{" "}
                {formatUsdCents(cost.highCents)}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-2">
                Material and labor by surface. A planning range, not a bid —
                a real estimate localizes by region, sub-base and access.
              </p>
            </div>
          )}
        </div>

        {/* Material takeoff. */}
        <div className="rounded-card border border-border bg-surface p-5">
          <CardHead icon={Ruler} title="Material takeoff" note="By surface" />
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {takeoff.map(({ material, areaSqft }) => {
              const info = materialInfo(material);
              return (
                <li
                  key={material}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-sm border border-border-bright"
                      style={{ backgroundColor: info.swatch }}
                    />
                    {info.label}
                  </span>
                  <span className="font-display text-sm tracking-tight text-foreground">
                    {Math.round(areaSqft).toLocaleString()} ft²
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-border-bright pt-4">
            <TakeoffCsvButton
              onExport={() => exportHardscapeTakeoffCsv(plan)}
              filename="atelier-hardscape-takeoff.csv"
            />
          </div>
        </div>

        <DepositSummary deposit={deposit} kind="hardscape" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Home — floor plan + program summary + area breakdown                        */
/* -------------------------------------------------------------------------- */

const ZONE_LABEL: Record<RoomZone, string> = {
  public: "Public",
  private: "Private",
  service: "Service",
  outdoor: "Outdoor",
};

function HomeContractorView({
  plan,
  parsed,
  deposit,
}: {
  plan: PlanGraph | null;
  parsed: ParsedRequirements | null;
  deposit: DepositFigure;
}) {
  // Aggregate room area by zone — the contractor's quick scope read.
  const byZone = useMemo(() => {
    if (!plan) return [];
    const totals = new Map<RoomZone, { area: number; rooms: number }>();
    for (const room of plan.rooms) {
      const prev = totals.get(room.zone) ?? { area: 0, rooms: 0 };
      totals.set(room.zone, {
        area: prev.area + room.areaSqft,
        rooms: prev.rooms + 1,
      });
    }
    return [...totals.entries()].map(([zone, t]) => ({ zone, ...t }));
  }, [plan]);

  if (!plan) {
    return (
      <EmptyState message="No floor plan to scope yet — describe the home and generate the plan first." />
    );
  }

  const totalArea = plan.rooms.reduce((sum, r) => sum + r.areaSqft, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-card border border-border bg-surface p-5">
        <CardHead icon={Ruler} title="Floor plan" note={plan.level} />
        <div className="mt-3">
          <PlanCanvas graph={plan} />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {parsed && (
          <div className="rounded-card border border-border bg-surface p-5">
            <CardHead
              icon={HardHat}
              title="Program summary"
              note={titleCase(parsed.style)}
            />
            <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
              {[
                {
                  label: "Finished area",
                  value: `${parsed.sqft.toLocaleString()} ft²`,
                },
                { label: "Bedrooms", value: String(parsed.beds) },
                { label: "Bathrooms", value: String(parsed.baths) },
                {
                  label: "Stories",
                  value:
                    parsed.story_count === 1
                      ? "Single story"
                      : `${parsed.story_count} stories`,
                },
              ].map((s) => (
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
          </div>
        )}

        <div className="rounded-card border border-border bg-surface p-5">
          <CardHead icon={Ruler} title="Area by zone" note="Room takeoff" />
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {byZone.map(({ zone, area, rooms }) => (
              <li
                key={zone}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="text-sm text-foreground">
                  {ZONE_LABEL[zone]}
                  <span className="ml-1.5 text-[11px] text-muted-2">
                    {rooms} {rooms === 1 ? "room" : "rooms"}
                  </span>
                </span>
                <span className="font-display text-sm tracking-tight text-foreground">
                  {Math.round(area).toLocaleString()} ft²
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex items-center justify-between border-t border-border-bright pt-3">
            <span className="text-sm font-medium text-foreground">
              Total room area
            </span>
            <span className="font-display text-lg tracking-tight text-copper-bright">
              {Math.round(totalArea).toLocaleString()} ft²
            </span>
          </div>
          <div className="mt-4 border-t border-border-bright pt-4">
            <TakeoffCsvButton
              onExport={() => exportHomeTakeoffCsv(plan)}
              filename="atelier-room-takeoff.csv"
            />
          </div>
        </div>

        <DepositSummary deposit={deposit} kind="home" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared building blocks                                                      */
/* -------------------------------------------------------------------------- */

function CardHead({
  icon: Icon,
  title,
  note,
}: {
  icon: typeof Ruler;
  title: string;
  note: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-copper" />
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-2">
        {note}
      </span>
    </div>
  );
}

function DepositSummary({
  deposit,
  kind,
}: {
  deposit: DepositFigure;
  kind: "home" | "hardscape";
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-sage" />
        <h2 className="text-sm font-medium text-foreground">
          {kind === "hardscape" ? "Deposit to collect" : "Design fee"}
        </h2>
      </div>
      <p className="mt-2 font-display text-xl tracking-tight text-copper-bright">
        {formatUsdCents(deposit.depositCents)}
      </p>
      <p className="mt-1 text-xs text-muted-2">
        {kind === "hardscape"
          ? `${Math.round(
              deposit.fraction * 100,
            )}% of the ${formatUsdCents(
              deposit.projectValueCents,
            )} job value — collected at client approval.`
          : "Consultation plus design deposit — billed when the client approves."}
      </p>
    </div>
  );
}

/**
 * A "download takeoff as CSV" button. Generates the line-item CSV from the
 * plan and triggers a real `.csv` download — the spreadsheet a contractor
 * drops into their own takeoff tool or hands to a supplier. Keyless and fully
 * client-side; best-effort, so a locked-down browser simply shows no
 * confirmation.
 */
function TakeoffCsvButton({
  onExport,
  filename,
}: {
  onExport: () => string;
  filename: string;
}) {
  const [done, setDone] = useState(false);

  function download() {
    try {
      downloadBlob(onExport(), filename, "text/csv;charset=utf-8");
      setDone(true);
      window.setTimeout(() => setDone(false), 2500);
    } catch {
      // Best-effort — no confirmation in a locked-down browser.
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={download}
      >
        <Download className="size-3.5" />
        {done ? "Takeoff downloaded" : "Export takeoff (CSV)"}
      </Button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-2">
        A line-item spreadsheet for your supplier or takeoff tool — generated
        in your browser.
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
      <Ruler className="mx-auto size-6 text-muted-2" />
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}
