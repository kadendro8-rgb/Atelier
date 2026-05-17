import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = "";
  let brief = "";
  try {
    const body = await req.json();
    if (body && typeof body.email === "string") email = body.email.trim();
    if (body && typeof body.brief === "string") brief = body.brief.trim();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // Supabase not configured (e.g. local dev without secrets) — accept the
  // lead so the flow isn't blocked, but report that it wasn't persisted.
  if (!supabase) {
    console.warn("save-brief: Supabase not configured; lead not persisted.");
    return NextResponse.json({ success: true, persisted: false });
  }

  const { error } = await supabase.from("leads").insert({ email, brief });
  if (error) {
    console.error("save-brief: Supabase insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not save your brief right now. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, persisted: true });
}
