/**
 * Builder publish route.
 *
 * `POST { projectId, brief }` finalizes a project for its client portal: it
 * persists the parsed `brief` and the derived pricing onto the existing
 * `projects` row, then returns the `/p/{slug}/{token}` portal path.
 *
 * The project row itself is created earlier in the flow (the lot step); the
 * floor plan is persisted by `builder/plan`. This route adds the last pieces
 * the portal needs — the brief and the `*_cents` pricing.
 *
 * Degrades gracefully: a keyless/local project id, an unconfigured Supabase,
 * or a missing row all resolve to `{ published: false }` at HTTP 200, so the
 * builder flow never dead-ends.
 */
import { NextResponse } from "next/server";
import { updateProject, DbUnavailableError } from "@/lib/db";
import type { Json } from "@/lib/db/types";
import { priceProject } from "@/lib/pricing";

export const runtime = "nodejs";

interface PublishBody {
  projectId?: unknown;
  brief?: unknown;
}

export async function POST(req: Request) {
  let body: PublishBody;
  try {
    body = (await req.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { projectId, brief } = body;
  if (
    typeof projectId !== "string" ||
    projectId.trim().length === 0 ||
    typeof brief !== "object" ||
    brief === null ||
    Array.isArray(brief)
  ) {
    return NextResponse.json(
      { error: "Expected { projectId: string, brief: object }." },
      { status: 400 },
    );
  }

  // A keyless/local project id never reached the database — nothing to update.
  if (projectId.startsWith("local-")) {
    return NextResponse.json({ published: false, reason: "local" });
  }

  const sqft = (brief as Record<string, unknown>).sqft;
  const pricing = priceProject(typeof sqft === "number" ? sqft : 0);

  try {
    const row = await updateProject(projectId, {
      brief: brief as Json,
      status: "review",
      design_fee_cents: pricing.designFeeCents,
      deposit_cents: pricing.depositCents,
      construction_estimate_cents: pricing.constructionEstimateCents,
    });

    if (!row.share_token) {
      return NextResponse.json({ published: false, reason: "no-token" });
    }
    return NextResponse.json({
      published: true,
      slug: row.slug,
      shareToken: row.share_token,
      portalPath: `/p/${encodeURIComponent(row.slug)}/${encodeURIComponent(row.share_token)}`,
    });
  } catch (err) {
    if (!(err instanceof DbUnavailableError)) {
      console.error("builder/publish: updateProject failed:", err);
    }
    // Supabase unconfigured, or the project row does not exist — degrade.
    return NextResponse.json({ published: false, reason: "unavailable" });
  }
}
