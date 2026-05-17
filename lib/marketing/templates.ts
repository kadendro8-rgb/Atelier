/**
 * Deterministic, on-brand content templates.
 *
 * These are the engine's floor: when no Anthropic key is configured (or the
 * API is unavailable) the agent falls back here, exactly as the design route
 * falls back to the on-device brief parser. Output is always valid, always
 * on-brand, and stable for a given input — never a broken or empty artifact.
 */
import { BRAND, CORE_HASHTAGS, PILLARS, pillarById } from "./brand";
import { PLATFORM_SPECS, trimToLimit } from "./platforms";
import { slugify, wordCount } from "./seo";
import type {
  AdCreative,
  AdObjective,
  Article,
  Platform,
  SocialPost,
} from "./types";

/** Stable short hash, for deterministic ids. */
function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/** Pillar-specific opening lines, used when no explicit theme is supplied. */
const PILLAR_LINES: Record<string, string> = {
  craft:
    "A wall section is a small decision with a long life — here is how we " +
    "keep it reading clean for the next forty years.",
  process:
    "A ten-minute conversation becomes permit-ready plans the same " +
    "afternoon — the speed comes from the system, never from cut corners.",
  "client-stories":
    "A builder brought us a hard lot and a tight timeline. One conversation " +
    "later, here is the plan that came out of it.",
  education:
    "Reading a floor plan well takes three checks — do them before a single " +
    "wall is framed and you will catch most of what goes wrong.",
  "behind-the-scenes":
    "Every plan that leaves the atelier passes the same quiet checklist. " +
    "Craft is not a feeling here — it is a standard.",
};

/** A closing brand line that varies by pillar. */
const PILLAR_CTA: Record<string, string> = {
  craft: "See the detail in your own plan at atelier.design.",
  process: "Start the conversation — atelier.design.",
  "client-stories": "Bring us your lot at atelier.design.",
  education: "Try it on your own brief at atelier.design.",
  "behind-the-scenes": "Step inside the atelier — atelier.design.",
};

/** Build one deterministic social post. */
function buildPost(
  platform: Platform,
  pillarId: string,
  theme: string | undefined,
  index: number,
): SocialPost {
  const spec = PLATFORM_SPECS[platform];
  const pillar = pillarById(pillarId);
  const lead = theme?.trim()
    ? `${theme.trim().replace(/\.$/, "")}.`
    : PILLAR_LINES[pillar.id] ?? PILLAR_LINES.craft;
  const cta = PILLAR_CTA[pillar.id] ?? PILLAR_CTA.process;

  const caption = trimToLimit(
    platform === "x" || platform === "threads"
      ? lead
      : `${lead}\n\n${cta}`,
    platform,
  );

  const [, max] = spec.hashtags;
  const topical = [pillar.id.replace(/-/g, ""), platform === "pinterest" ? "homeplanning" : "homebuilding"];
  const hashtags = [...new Set([...topical, ...CORE_HASHTAGS])].slice(0, max);

  const format = spec.formats[index % spec.formats.length];
  const id = `post_${platform}_${hash(`${pillar.id}${theme ?? ""}${index}`)}`;
  // Alt text: the pillar subject, trimmed to a whole word near 120 chars.
  const altSubject = lead.replace(/\.$/, "");
  const altText = `${BRAND.name} — ${pillar.label.toLowerCase()}: ${
    altSubject.length > 120
      ? `${altSubject.slice(0, 120).replace(/\s+\S*$/, "")}…`
      : altSubject
  }`;

  return {
    id,
    platform,
    format,
    pillar: pillar.id,
    caption,
    hashtags,
    altText,
    cta,
    assetBrief:
      `${format} for ${spec.label}, ${spec.aspectRatio}. Calm, premium, ` +
      `craft-forward imagery for the "${pillar.label}" pillar. ${spec.voiceNote}`,
    firstComment:
      spec.hashtags[1] > 6 && platform === "instagram"
        ? `More at ${BRAND.url}`
        : undefined,
  };
}

/** Deterministic fallback batch of social posts. */
export function fallbackSocialPosts(
  platform: Platform,
  count: number,
  pillarIds: string[],
  themes: string[],
): SocialPost[] {
  const pillars = pillarIds.length ? pillarIds : PILLARS.map((p) => p.id);
  return Array.from({ length: Math.max(1, count) }, (_, i) =>
    buildPost(platform, pillars[i % pillars.length], themes[i], i),
  );
}

/** Deterministic fallback article. */
export function fallbackArticle(
  topic: string,
  publishDate: string,
  keywords: string[],
): Article {
  const title = topic.trim() || "How a conversation becomes a custom-home design";
  const slug = slugify(title);
  const answer =
    `${BRAND.name} is a custom-home design studio that turns a plain-language ` +
    `brief into permit-ready floor plans, site plans, photoreal renders, and a ` +
    `client portal that collects the deposit — typically in a single afternoon.`;

  const body = [
    `## The short answer`,
    "",
    answer,
    "",
    `## Why ${title.toLowerCase()} matters`,
    "",
    "Custom-home design has historically meant weeks of back-and-forth " +
      "before a client sees anything real. That gap is where deals stall and " +
      "where builders lose momentum. Closing it — without lowering the " +
      "standard of the drawing set — is the whole point of the studio.",
    "",
    "## How Atelier approaches it",
    "",
    "The work starts with a conversation, not a form. A builder describes " +
      "the home in plain language; Atelier reads the brief, sites the home " +
      "on the real lot with real terrain and setbacks, and generates a floor " +
      "plan that is checked against residential code as it is drawn.",
    "",
    "From there the design becomes photoreal renders and a sheet set, and a " +
      "branded client portal turns the whole thing into an approval and a " +
      "deposit. The speed is real; the corners are not cut.",
    "",
    "## What to do next",
    "",
    `Bring a real lot and a real brief to [${BRAND.name}](${BRAND.url}) and ` +
      "watch the loop run once. That is the fastest way to see whether it " +
      "fits how you already work.",
  ].join("\n");

  const faq = [
    {
      question: `What is ${BRAND.name}?`,
      answer,
    },
    {
      question: "How long does a custom-home design take with Atelier?",
      answer:
        "A first permit-ready draft — floor plans, a site plan, and renders " +
        "— typically comes together in a single afternoon, then iterates " +
        "with the client from there.",
    },
    {
      question: "Does Atelier replace an architect?",
      answer:
        "No. Atelier gives builders and architects a faster path from brief " +
        "to drawings; design control and final stamping stay with the " +
        "professional.",
    },
    {
      question: "Where does Atelier work?",
      answer:
        "Atelier serves custom-home builders and homeowners across Indiana " +
        "and the wider Midwest, with site intelligence for any US parcel.",
    },
  ];

  return {
    slug,
    title,
    metaTitle: title.slice(0, 60),
    metaDescription:
      `${answer}`.slice(0, 158),
    excerpt: answer,
    body,
    keywords: keywords.length
      ? keywords
      : ["custom home design", "permit-ready plans", "atelier"],
    faq,
    wordCount: wordCount(body),
    publishDate,
  };
}

/** Deterministic fallback ad creative. */
export function fallbackAdCreatives(
  platform: Platform,
  objective: AdObjective,
  variants: number,
): AdCreative[] {
  const labels = ["A", "B", "C", "D"];
  const angles = [
    {
      headline: "Plans by the afternoon",
      primary:
        "A client conversation becomes permit-ready custom-home plans the " +
        "same afternoon. Win the project before the competition has booked " +
        "a meeting.",
    },
    {
      headline: "Design without the wait",
      primary:
        "Floor plans, site plans, and photoreal renders from one brief — " +
        "code-checked as they are drawn. The standard stays; the timeline " +
        "does not.",
    },
    {
      headline: "From brief to deposit",
      primary:
        "Atelier turns a conversation into a design and a branded client " +
        "portal that collects the deposit. See the loop run on your own lot.",
    },
    {
      headline: "Built for custom-home builders",
      primary:
        "Site the home on the real parcel, generate the plan, render it, " +
        "and send a portal that closes. Premium work, on a builder's clock.",
    },
  ];

  return Array.from({ length: Math.max(1, Math.min(variants, 4)) }, (_, i) => {
    const a = angles[i % angles.length];
    return {
      id: `ad_${platform}_${objective}_${labels[i]}`,
      platform,
      objective,
      variant: labels[i],
      primaryText: a.primary,
      headline: a.headline,
      description: BRAND.tagline,
      cta: objective === "leads" ? "Sign up" : "Learn more",
      audience:
        "Custom-home builders and residential designers, US, interested in " +
        "architecture software and homebuilding tools.",
      assetBrief:
        `${PLATFORM_SPECS[platform].aspectRatio} creative — a photoreal ` +
        "render paired with a clean floor plan; calm, premium, craft-forward.",
    };
  });
}
