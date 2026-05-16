import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Lead = { email: string; brief: string; savedAt: string };

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

  const lead: Lead = { email, brief, savedAt: new Date().toISOString() };

  // Best-effort local persistence. On a read-only serverless filesystem this
  // is skipped gracefully; durable storage (Cloudflare KV) is tracked in
  // docs/v2-spec.md.
  try {
    const dir = path.join(process.cwd(), "data");
    const file = path.join(dir, "leads.json");
    await fs.mkdir(dir, { recursive: true });
    let leads: Lead[] = [];
    try {
      leads = JSON.parse(await fs.readFile(file, "utf8")) as Lead[];
    } catch {
      leads = [];
    }
    leads.push(lead);
    await fs.writeFile(file, JSON.stringify(leads, null, 2));
  } catch (err) {
    console.error("save-brief: could not persist lead to disk:", err);
  }

  return NextResponse.json({ success: true });
}
