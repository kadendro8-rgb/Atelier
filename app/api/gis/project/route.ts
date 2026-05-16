/**
 * Project-creation route for the lot picker.
 *
 * Persists a new project (parcel geometry + site `meta`) via W1's typed
 * `createProject`. When Supabase is not configured, or there is no
 * authenticated owner, it responds `200` with `{ persisted: false }` so the
 * client can fall back to a localStorage-backed project id and the lot flow
 * still works keyless.
 */
import { NextResponse } from "next/server";
import { createProject, DbUnavailableError } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Json, ProjectInsert } from "@/lib/db/types";
import type { SiteMeta } from "@/lib/gis/types";

export const runtime = "nodejs";

interface ProjectBody {
  name?: unknown;
  address?: unknown;
  parcelGeojson?: unknown;
  meta?: unknown;
}

/** Build a URL-safe slug with a short random suffix for uniqueness. */
function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "project"}-${suffix}`;
}

export async function POST(req: Request) {
  let body: ProjectBody;
  try {
    body = (await req.json()) as ProjectBody;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : "Untitled project";
  const address = typeof body.address === "string" ? body.address : null;
  const parcelGeojson = (body.parcelGeojson ?? null) as Json | null;
  // The client posts a flat SiteMeta; persist it namespaced under `meta.site`.
  const siteMeta = (body.meta ?? null) as SiteMeta | null;

  // No authenticated owner — the client falls back to localStorage.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ persisted: false, reason: "no-session" });
  }

  const insert: ProjectInsert = {
    owner_id: session.user.id,
    name,
    slug: makeSlug(name),
    address,
    parcel_geojson: parcelGeojson,
    meta: siteMeta ? { site: siteMeta } : null,
  };

  try {
    const row = await createProject(insert);
    return NextResponse.json({ persisted: true, projectId: row.id });
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      // Supabase not configured — degrade gracefully, keep the flow alive.
      return NextResponse.json({ persisted: false, reason: "db-unavailable" });
    }
    console.error("gis/project: createProject failed:", err);
    return NextResponse.json({ persisted: false, reason: "db-error" });
  }
}
