/**
 * Streets route — Overpass `highway` ways around a parcel.
 *
 * Accepts `{ bbox: [w,s,e,n] }` (the parcel bbox; expanded by ~200m), returns
 * a GeoJSON FeatureCollection of LineStrings. Failure-tolerant: on error it
 * responds `200` with an empty collection.
 */
import { NextResponse } from "next/server";
import { streetsInBBox } from "@/lib/gis/overpass";
import { expandBBox } from "@/lib/gis/geometry";
import type { BBox } from "@/lib/gis/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Cap the expanded bbox span so Overpass never times out on huge areas. */
const MAX_SPAN_DEG = 0.02;

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

  const expanded = expandBBox(bbox, 200);
  if (
    expanded[2] - expanded[0] > MAX_SPAN_DEG ||
    expanded[3] - expanded[1] > MAX_SPAN_DEG
  ) {
    return NextResponse.json({
      streets: { type: "FeatureCollection", features: [] },
      capped: true,
    });
  }

  try {
    const streets = await streetsInBBox(expanded);
    return NextResponse.json({ streets });
  } catch (err) {
    console.error("gis/streets: Overpass failed:", err);
    return NextResponse.json({
      streets: { type: "FeatureCollection", features: [] },
    });
  }
}
