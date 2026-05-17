/**
 * GET-by-POST elevation route — USGS 3DEP for a parcel bounding box.
 *
 * Accepts `{ bbox: [w,s,e,n] }`, returns a 64×64 elevation grid. On any
 * failure it responds `200` with `{ elevation: null }` so the lot flow can
 * proceed offline-safely; it never returns a blocking error.
 */
import { NextResponse } from "next/server";
import { elevationGrid } from "@/lib/gis/elevation";
import type { BBox } from "@/lib/gis/types";

export const runtime = "nodejs";
export const maxDuration = 30;

function parseBBox(value: unknown): BBox | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const nums = value.map((v) => Number(v));
  if (!nums.every((v) => Number.isFinite(v))) return null;
  return [nums[0], nums[1], nums[2], nums[3]];
}

export async function POST(req: Request) {
  let bbox: BBox | null = null;
  try {
    const body = await req.json();
    bbox = parseBBox(body?.bbox);
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  if (!bbox) {
    return NextResponse.json(
      { error: "A bbox [w,s,e,n] is required." },
      { status: 400 },
    );
  }

  try {
    const elevation = await elevationGrid(bbox);
    return NextResponse.json({ elevation });
  } catch (err) {
    console.error("gis/elevation: sampling failed:", err);
    return NextResponse.json({ elevation: null });
  }
}
