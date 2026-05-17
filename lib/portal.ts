/**
 * Maps a persisted project — the `projects` row plus its owner/client
 * profiles — into the `PortalProject` view-model the client portal renders.
 *
 * Real fields (project name, builder identity, pricing, and the floor-plan /
 * room data derived from the stored kernel `plan_graph`) come straight from
 * the database. Renders and documents have no real data source yet — there is
 * no render pipeline and no document storage (see docs/project-state.md) — so
 * those borrow the deterministic placeholder set, keeping every portal tab
 * populated until those features land.
 */
import type { ProfileRow, ProjectRow } from "@/lib/db/types";
import type { Room as KernelRoom } from "@/lib/kernel/types";
import {
  buildPortalProject,
  type PortalPlan,
  type PortalProject,
  type PortalRoom,
} from "@/lib/portal-mock";

/** Room uses that count toward the bedroom tally. */
const SLEEPING_USES = new Set<string>(["bedroom", "primary-suite"]);

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function initials(value: string): string {
  const words = value.split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "A") + (words[1]?.[0] ?? "")).toUpperCase();
}

/** A finite number, or undefined. */
function finiteNum(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Plain-object guard for the loosely-typed `brief` / `plan_graph` columns. */
function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Convert an integer cents column to whole dollars (0 when absent). */
function dollars(cents: number | null): number {
  return cents && cents > 0 ? Math.round(cents / 100) : 0;
}

/**
 * Build the portal view-model for a real project. Every field the schema can
 * supply is mapped from the row; renders and documents fall back to the
 * deterministic placeholders keyed off the share link.
 */
export function toPortalProject(args: {
  project: ProjectRow;
  owner: ProfileRow | null;
  client: ProfileRow | null;
  token: string;
}): PortalProject {
  const { project, owner, client, token } = args;

  const brief = asRecord(project.brief);
  const graph = asRecord(project.plan_graph);
  const rooms: KernelRoom[] = Array.isArray(graph.rooms)
    ? (graph.rooms as KernelRoom[])
    : [];

  const roomsArea = Math.round(
    rooms.reduce((sum, r) => sum + (finiteNum(r.areaSqft) ?? 0), 0),
  );

  const squareFeet = finiteNum(brief.sqft) ?? roomsArea;
  const bedrooms =
    finiteNum(brief.beds) ?? rooms.filter((r) => SLEEPING_USES.has(r.use)).length;
  const bathrooms =
    finiteNum(brief.baths) ?? rooms.filter((r) => r.use === "bathroom").length;

  const styleLabel =
    typeof brief.style === "string" && brief.style.trim()
      ? titleCase(brief.style)
      : "Custom";

  const builderName =
    owner?.company_name?.trim() ||
    owner?.display_name?.trim() ||
    "Atelier Studio";
  const clientName = client?.display_name?.trim() || "your client";
  const location = project.address?.trim() || "Location TBD";

  const portalRooms: PortalRoom[] = rooms.map((r) => ({
    name: r.label,
    area: `${Math.round(finiteNum(r.areaSqft) ?? 0).toLocaleString("en-US")} sq ft`,
    finish: r.finishFloor?.trim() || "Finish TBD",
  }));

  const plans: PortalPlan[] =
    rooms.length > 0
      ? [
          {
            level:
              typeof graph.level === "string" && graph.level.trim()
                ? graph.level
                : "Main Level",
            area: `${roomsArea.toLocaleString("en-US")} sq ft`,
            rooms: rooms.map((r) => r.label).join(", "),
          },
        ]
      : [];

  // Renders + documents have no real data source yet (Phase 3) — borrow the
  // deterministic placeholders so every portal tab stays populated.
  const placeholder = buildPortalProject(project.slug, token);

  return {
    slug: project.slug,
    token,
    builderName,
    builderInitials: initials(builderName),
    projectName: project.name,
    clientName,
    location,
    styleLabel,
    squareFeet,
    bedrooms,
    bathrooms,
    heroCaption: `${styleLabel} · ${squareFeet.toLocaleString("en-US")} sq ft · ${location}`,
    designFee: dollars(project.design_fee_cents),
    deposit: dollars(project.deposit_cents),
    constructionEstimate: dollars(project.construction_estimate_cents),
    plans: plans.length > 0 ? plans : placeholder.plans,
    renders: placeholder.renders,
    rooms: portalRooms.length > 0 ? portalRooms : placeholder.rooms,
    documents: placeholder.documents,
  };
}
