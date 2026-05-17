/**
 * Builder floor-plan persistence route.
 *
 * `GET ?projectId=…`  → `{ planGraph: <stored> | null }`. Any failure
 * (Supabase unconfigured, missing project, query error) degrades to
 * `{ planGraph: null }` at HTTP 200 so the builder can fall back to its
 * client-side generate + localStorage path.
 *
 * `PUT { projectId, planGraph }` → persists the kernel `PlanGraph` via W1's
 * typed `savePlanGraph`. Responds `{ persisted: true }`, or
 * `{ persisted: false }` at HTTP 200 when persistence is unavailable. A
 * malformed body is rejected with 400.
 *
 * The kernel `PlanGraph` is the rich type the UI consumes; `projects.plan_graph`
 * stores structured JSON. We store/restore the kernel graph directly, casting
 * through the DB `PlanGraph` JSON type at the boundary.
 */
import { NextResponse } from "next/server";
import {
  getPlanGraph,
  savePlanGraph,
  DbUnavailableError,
  type PlanGraph as DbPlanGraph,
} from "@/lib/db";

export const runtime = "nodejs";

interface PutBody {
  projectId?: unknown;
  planGraph?: unknown;
}

export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ planGraph: null });
  }

  try {
    const planGraph = await getPlanGraph(projectId);
    return NextResponse.json({ planGraph: planGraph ?? null });
  } catch (err) {
    if (!(err instanceof DbUnavailableError)) {
      console.error("builder/plan: getPlanGraph failed:", err);
    }
    // Supabase unconfigured, missing project, or query error — degrade.
    return NextResponse.json({ planGraph: null });
  }
}

export async function PUT(req: Request) {
  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const projectId = body.projectId;
  const planGraph = body.planGraph;
  if (
    typeof projectId !== "string" ||
    projectId.trim().length === 0 ||
    typeof planGraph !== "object" ||
    planGraph === null ||
    Array.isArray(planGraph)
  ) {
    return NextResponse.json(
      { error: "Expected { projectId: string, planGraph: object }." },
      { status: 400 },
    );
  }

  try {
    // The kernel PlanGraph is structured JSON; cast at the DB boundary.
    await savePlanGraph(projectId, planGraph as DbPlanGraph);
    return NextResponse.json({ persisted: true });
  } catch (err) {
    if (!(err instanceof DbUnavailableError)) {
      console.error("builder/plan: savePlanGraph failed:", err);
    }
    // Supabase unconfigured or the project does not exist — degrade.
    return NextResponse.json({ persisted: false });
  }
}
