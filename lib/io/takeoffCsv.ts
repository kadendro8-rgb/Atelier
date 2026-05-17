/**
 * Material-takeoff CSV export for the packaging stage's Contractor view.
 *
 * Turns a finished project into a flat, line-item CSV — the spreadsheet the
 * contractor drops into their own takeoff tool or hands to a supplier. This is
 * what makes the marketing claim ("exports the estimate and material list as
 * PDF and CSV", see `components/sections/FAQ.tsx`) genuinely true.
 *
 * Two shapes, one CSV format:
 *  - hardscape → one row per placed element: label, material, area, and the
 *                installed-cost range derived from `lib/hardscape/cost`;
 *  - home      → one row per room: label, use/zone, finished area.
 *
 * Everything here is pure and keyless — no network, no env, no server.
 */
import { estimateCost } from "@/lib/hardscape/cost";
import { materialInfo } from "@/lib/hardscape/builder";
import type { HardscapeMaterial, HardscapePlan } from "@/lib/hardscape/types";
import type { PlanGraph } from "@/lib/kernel/types";

/* -------------------------------------------------------------------------- */
/* CSV primitives                                                             */
/* -------------------------------------------------------------------------- */

/** RFC-4180 escape: quote a field when it holds a comma, quote or newline. */
function csvField(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Join a 2D array of cells into a CRLF-delimited CSV document. */
function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvField).join(",")).join("\r\n") + "\r\n";
}

/* -------------------------------------------------------------------------- */
/* Per-material installed cost (hardscape)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Per-square-foot installed-cost range for a material, in whole dollars.
 * Derived from `estimateCost` by costing a 1 sqft single-element plan — this
 * keeps the CSV's rates locked to the same model the rest of the stage uses,
 * without re-exporting the kernel's private `COST_PER_SQFT` table.
 */
function ratePerSqft(material: HardscapeMaterial): {
  low: number;
  high: number;
} {
  const probe: HardscapePlan = {
    schemaVersion: 1,
    seed: 0,
    elements: [
      {
        id: "probe",
        kind: "patio",
        material,
        polygon: [],
        areaSqft: 1,
        label: "probe",
      },
    ],
    totalAreaSqft: 1,
    bounds: { width: 0, height: 0 },
  };
  const c = estimateCost(probe);
  return { low: c.lowCents / 100, high: c.highCents / 100 };
}

/* -------------------------------------------------------------------------- */
/* Hardscape takeoff                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Build a material-takeoff CSV for a hardscape plan: one row per element with
 * its surface material, area, and low/high installed cost, then a totals row.
 */
export function exportHardscapeTakeoffCsv(plan: HardscapePlan): string {
  const rows: (string | number)[][] = [
    [
      "Element",
      "Kind",
      "Material",
      "Area (sq ft)",
      "Installed cost low (USD)",
      "Installed cost high (USD)",
    ],
  ];

  let totalArea = 0;
  let totalLow = 0;
  let totalHigh = 0;

  for (const el of plan.elements) {
    const rate = ratePerSqft(el.material);
    const area = Math.max(el.areaSqft, 0);
    const low = Math.round(area * rate.low);
    const high = Math.round(area * rate.high);
    totalArea += area;
    totalLow += low;
    totalHigh += high;
    rows.push([
      el.label,
      el.kind,
      materialInfo(el.material).label,
      Math.round(area),
      low,
      high,
    ]);
  }

  rows.push([
    "Total",
    "",
    "",
    Math.round(totalArea),
    Math.round(totalLow),
    Math.round(totalHigh),
  ]);

  return toCsv(rows);
}

/* -------------------------------------------------------------------------- */
/* Home takeoff                                                               */
/* -------------------------------------------------------------------------- */

const ZONE_LABEL: Record<string, string> = {
  public: "Public",
  private: "Private",
  service: "Service",
  outdoor: "Outdoor",
};

/**
 * Build a room-area takeoff CSV for a home plan: one row per room with its
 * use, zone and finished area, then a totals row. Homes carry no per-room
 * cost in the kernel, so the cost columns are intentionally omitted — the CSV
 * never invents a number it does not have.
 */
export function exportHomeTakeoffCsv(graph: PlanGraph): string {
  const rows: (string | number)[][] = [
    ["Room", "Use", "Zone", "Finished area (sq ft)"],
  ];

  let total = 0;
  for (const room of graph.rooms) {
    const area = Math.max(room.areaSqft, 0);
    total += area;
    rows.push([
      room.label,
      room.use,
      ZONE_LABEL[room.zone] ?? room.zone,
      Math.round(area),
    ]);
  }

  rows.push(["Total", "", "", Math.round(total)]);

  return toCsv(rows);
}
