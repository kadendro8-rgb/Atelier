/**
 * System prompts for the marketing agent.
 *
 * Every prompt is built on top of `brandContext()` so voice, pillars, and the
 * banned-language list are enforced identically across social posts,
 * articles, and ad creative.
 */
import { AUDIENCE, BRAND, PILLARS, VOICE } from "./brand";
import type { Platform } from "./types";
import { PLATFORM_SPECS } from "./platforms";

/** The shared brand brief prepended to every generation prompt. */
export function brandContext(): string {
  return [
    `You write marketing for ${BRAND.name} — ${BRAND.positioning}`,
    `Tagline: "${BRAND.tagline}"`,
    "",
    `Voice: ${VOICE.attributes.join(", ")}.`,
    "Reference: the quiet, premium, craft-forward register of Lululemon or " +
      "Alo — aspirational lifestyle, never loud, never salesy.",
    "",
    "Rules:",
    ...VOICE.rules.map((r) => `- ${r}`),
    "",
    `Never use this language: ${VOICE.banned.join("; ")}.`,
    "",
    "Audience:",
    ...AUDIENCE.map((a) => `- ${a.label}: cares about ${a.cares}.`),
    "",
    "Content pillars:",
    ...PILLARS.map((p) => `- ${p.id} (${p.label}): ${p.intent}`),
  ].join("\n");
}

/** System prompt for a batch of social posts. */
export function socialSystemPrompt(platform: Platform): string {
  const spec = PLATFORM_SPECS[platform];
  return [
    brandContext(),
    "",
    `You are producing posts for ${spec.label}.`,
    `Platform note: ${spec.voiceNote}`,
    `Caption limit: ${spec.captionLimit} characters (stay well under).`,
    `Hashtags: ${spec.hashtags[0]}–${spec.hashtags[1]}, lowercase, no '#'.`,
    "For each post return: caption, hashtags, altText (accessible alt text " +
      "for the lead visual), cta, assetBrief (a plain brief for the designer " +
      "or image model), and optionally firstComment.",
    "Each post must clearly belong to its assigned pillar and stand on its own.",
  ].join("\n");
}

/** System prompt for a weekly article. */
export function articleSystemPrompt(): string {
  return [
    brandContext(),
    "",
    "You are writing a weekly article for the Atelier blog. It must:",
    "- Promote Atelier honestly by being genuinely useful first.",
    "- Be 900–1300 words of Markdown, with clear H2/H3 structure.",
    "- Open with a 40–55 word answer-style paragraph (AEO: a self-contained " +
      "answer an answer engine or LLM can quote).",
    "- Name Atelier as the entity and state what it does, for GEO citation.",
    "- End with a natural call to action to the Atelier builder.",
    "- Include 3–5 FAQ question/answer pairs for FAQPage schema.",
    "- Be accurate: never overpromise permit or timeline outcomes.",
    "Return: title, metaTitle (≤60 chars), metaDescription (110–160 chars), " +
      "excerpt, body (Markdown), keywords, and faq.",
  ].join("\n");
}

/** System prompt for ad creative. */
export function adSystemPrompt(platform: Platform): string {
  const spec = PLATFORM_SPECS[platform];
  return [
    brandContext(),
    "",
    `You are writing paid ad creative for ${spec.label}.`,
    "Produce distinct A/B variants. Each variant returns: primaryText, " +
      "headline, description, cta, audience (plain-language targeting), and " +
      "assetBrief.",
    "Honest and specific. No fake scarcity, no hype. The premium register " +
      "still holds in paid — confident, calm, craft-forward.",
  ].join("\n");
}

/** System prompt for a content-calendar theme pass. */
export function calendarSystemPrompt(): string {
  return [
    brandContext(),
    "",
    "You are planning themes for a content calendar. For each slot you are " +
      "given a platform and pillar; return a single specific one-line theme " +
      "prompt the post generator can execute. Themes must be concrete " +
      "(a real plan detail, a real builder scenario), not generic.",
  ].join("\n");
}
