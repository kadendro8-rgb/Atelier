import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { parseBriefFallback, type ParsedRequirements } from "@/lib/builder";

export const runtime = "nodejs";

const SYSTEM = `You are Atelier's design-intake engine. Parse the builder's plain-language brief into structured JSON with exactly these keys:
- sqft (integer), beds (integer), baths (number), style (string)
- story_count (integer), lot_size (string)
- must_haves (array of short strings), optional_features (array of short strings)
- code_jurisdiction_hint (string)
Infer sensible values for anything the brief leaves unstated. Return JSON only — no prose, no code fences.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Coerce a raw model object into a safe ParsedRequirements. */
function coerce(raw: unknown, brief: string): ParsedRequirements {
  const fb = parseBriefFallback(brief);
  if (!raw || typeof raw !== "object") return fb;
  const r = raw as Record<string, unknown>;

  const num = (v: unknown, d: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : d;
  const str = (v: unknown, d: string) =>
    typeof v === "string" && v.trim() ? v.trim() : d;
  const strArr = (v: unknown) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").slice(0, 8)
      : [];

  return {
    sqft: Math.round(num(r.sqft, fb.sqft)),
    beds: Math.round(num(r.beds, fb.beds)),
    baths: num(r.baths, fb.baths),
    style: str(r.style, fb.style),
    story_count: Math.round(num(r.story_count, fb.story_count)),
    lot_size: str(r.lot_size, fb.lot_size),
    must_haves: strArr(r.must_haves).length ? strArr(r.must_haves) : fb.must_haves,
    optional_features: strArr(r.optional_features),
    code_jurisdiction_hint: str(r.code_jurisdiction_hint, fb.code_jurisdiction_hint),
  };
}

/** Call Claude with bounded retries on transient failures. */
async function callClaude(client: Anthropic, brief: string): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM,
        messages: [{ role: "user", content: brief.slice(0, 2000) }],
      });
      const block = msg.content.find((b) => b.type === "text");
      if (!block || block.type !== "text") {
        throw new Error("Anthropic API returned no text block");
      }
      const json = block.text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      return JSON.parse(json);
    } catch (err) {
      if (attempt === 2) throw err;
      if (err instanceof Anthropic.APIError) {
        const s = err.status;
        // 4xx other than 429 is a request bug — don't retry.
        if (typeof s === "number" && s >= 400 && s < 500 && s !== 429) {
          throw err;
        }
      }
      await sleep(Math.min(1000 * 2 ** attempt, 4000));
    }
  }
  throw new Error("Anthropic API unavailable after retries");
}

export async function POST(req: Request) {
  let brief = "";
  try {
    const body = await req.json();
    if (body && typeof body.brief === "string") brief = body.brief;
  } catch {
    // malformed body — handled by the length check below
  }

  if (brief.trim().length < 8) {
    return NextResponse.json({ error: "Brief is too short." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      source: "fallback",
      parsed: parseBriefFallback(brief),
    });
  }

  try {
    const client = new Anthropic({ apiKey, maxRetries: 0 });
    const raw = await callClaude(client, brief);
    return NextResponse.json({ source: "ai", parsed: coerce(raw, brief) });
  } catch (err) {
    console.error("parse-brief: Claude API failed, using local parser:", err);
    return NextResponse.json({
      source: "fallback",
      parsed: parseBriefFallback(brief),
      notice: "AI parser temporarily unavailable — used the local parser.",
    });
  }
}
