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

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  let brief = "";
  try {
    const body = await req.json();
    if (body && typeof body.brief === "string") brief = body.brief;
  } catch {
    // malformed body — fall through to fallback
  }

  if (!apiKey || brief.trim().length < 3) {
    return NextResponse.json({ source: "fallback" });
  }

  try {
    const client = new Anthropic({ apiKey });
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
      return NextResponse.json({ source: "fallback" });
    }

    const params = JSON.parse(textBlock.text);
    return NextResponse.json({ source: "ai", params });
  } catch (err) {
    console.error("Atelier design intake failed:", err);
    return NextResponse.json({ source: "fallback" });
  }
}
