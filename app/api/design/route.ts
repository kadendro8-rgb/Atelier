import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { STYLE_IDS } from "@/lib/design";

export const runtime = "nodejs";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    style: { type: "string", enum: STYLE_IDS },
    sqft: { type: "integer" },
    beds: { type: "integer", enum: [3, 4, 5] },
    baths: { type: "number" },
    stories: { type: "integer", enum: [1, 2, 3] },
    garageBays: { type: "integer", enum: [2, 3] },
    lotAcres: { type: "number" },
    features: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
  required: [
    "style",
    "sqft",
    "beds",
    "baths",
    "stories",
    "garageBays",
    "lotAcres",
    "features",
    "summary",
  ],
} as const;

const SYSTEM = `You are the design-intake engine for Atelier, a tool that turns a builder's plain-language brief into a custom-home design.

Read the brief and extract structured design parameters:
- style: the closest architectural style from the allowed list.
- sqft: total finished square footage. If unstated, infer a sensible figure from bedroom count and described scope.
- beds / baths: bedroom and bathroom counts.
- stories: number of above-grade levels (1 unless the brief implies otherwise).
- garageBays: 2 or 3.
- lotAcres: lot size in acres; default 0.5 if unstated.
- features: short title-case phrases for notable extras the brief mentions (e.g. "Covered porch", "Home office", "Vaulted great room"). Empty array if none.
- summary: one concise sentence restating the home.

Always return every field. Never invent features the brief does not imply.`;

const MAX_RETRIES = 3;
const FALLBACK_NOTICE =
  "AI parser temporarily unavailable — using local parser. Results may be less detailed.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoffMs = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000);

/** Read a header value whether `headers` is a Headers instance or a plain object. */
function headerValue(headers: unknown, name: string): string | null {
  if (!headers) return null;
  const maybe = headers as { get?: (k: string) => string | null };
  if (typeof maybe.get === "function") return maybe.get(name);
  const rec = headers as Record<string, string | undefined>;
  return rec[name] ?? rec[name.toLowerCase()] ?? null;
}

/** Honor a 429 `retry-after` header, clamped so a hostile value can't stall the request. */
function retryAfterMs(headers: unknown): number {
  const secs = parseInt(headerValue(headers, "retry-after") ?? "", 10);
  return (Number.isFinite(secs) && secs > 0 ? Math.min(secs, 30) : 5) * 1000;
}

/**
 * Call Claude with bounded retries.
 *
 * Transient failures retry: 5xx (exponential backoff), 429 (honor
 * `retry-after`), and connection errors. A 4xx other than 429 is a bug in
 * our request, so it is surfaced immediately for the caller to fall back.
 */
async function requestDesignParams(
  client: Anthropic,
  brief: string,
): Promise<unknown> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 1024,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: SCHEMA },
        },
        system: [
          { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        ],
        messages: [{ role: "user", content: brief.slice(0, 2000) }],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("Anthropic API returned no text block");
      }
      return JSON.parse(textBlock.text);
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;

      if (err instanceof Anthropic.APIError) {
        const status = err.status;
        if (status === 429) {
          await sleep(retryAfterMs(err.headers));
          continue;
        }
        // 4xx other than 429 — our bug, don't retry.
        if (typeof status === "number" && status >= 400 && status < 500) {
          throw err;
        }
      }
      // 5xx and connection/unknown errors — transient, back off and retry.
      await sleep(backoffMs(attempt));
    }
  }
  throw new Error("Anthropic API unavailable after retries");
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  let brief = "";
  try {
    const body = await req.json();
    if (body && typeof body.brief === "string") brief = body.brief;
  } catch {
    // malformed body — fall through to fallback
  }

  // No key configured or too-short brief: on-device parsing is the expected
  // path here, not a failure — return a quiet fallback with no notice.
  if (!apiKey || brief.trim().length < 3) {
    return NextResponse.json({ source: "fallback" });
  }

  try {
    // maxRetries: 0 — the retry policy lives in requestDesignParams.
    const client = new Anthropic({ apiKey, maxRetries: 0 });
    const params = await requestDesignParams(client, brief);
    return NextResponse.json({ source: "ai", params });
  } catch (err) {
    console.error("Claude API failed, falling back to on-device parser:", err);
    return NextResponse.json({ source: "fallback", notice: FALLBACK_NOTICE });
  }
}
