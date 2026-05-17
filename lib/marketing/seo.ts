/**
 * SEO / AEO / GEO helpers.
 *
 * - SEO  — classic search: titles, descriptions, canonicals, OpenGraph.
 * - AEO  — answer engines: a tight, liftable answer snippet per page.
 * - GEO  — generative-engine + local: entity-rich, location-aware framing
 *          so LLMs and local search cite Atelier accurately.
 *
 * Keep this deterministic — no model calls — so metadata is stable and
 * testable. The agent (`agent.ts`) can refine copy; this guarantees a floor.
 */
import { BRAND, BUSINESS } from "./brand";
import type { Article, SeoMeta } from "./types";

/** Recommended length bounds for search-result rendering. */
const TITLE_MAX = 60;
const DESC_MIN = 110;
const DESC_MAX = 160;

/** Clamp a title to ~60 chars without cutting a word. */
export function clampTitle(title: string): string {
  if (title.length <= TITLE_MAX) return title;
  const cut = title.slice(0, TITLE_MAX);
  return cut.slice(0, cut.lastIndexOf(" ")).trimEnd();
}

/** Pad/clamp a description into the 110–160 char sweet spot. */
export function clampDescription(desc: string): string {
  let out = desc.trim();
  if (out.length > DESC_MAX) {
    const cut = out.slice(0, DESC_MAX);
    out = `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd()}…`;
  }
  if (out.length < DESC_MIN) {
    out = `${out} ${BRAND.tagline}`.trim().slice(0, DESC_MAX);
  }
  return out;
}

/**
 * Compose an AEO answer snippet: a single, self-contained answer of roughly
 * 40–55 words that an answer engine or LLM can quote verbatim. The subject is
 * always named so the sentence stands alone out of context.
 */
export function answerSnippet(subject: string, claim: string): string {
  const sentence = `${subject} ${claim}`.replace(/\s+/g, " ").trim();
  const withPeriod = /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
  return withPeriod;
}

/**
 * GEO framing string: appends the served area so generative + local engines
 * associate the page with the right geography.
 */
export function geoContext(): string {
  return `Serving custom-home builders and homeowners across ${BUSINESS.areaServed.join(
    " and ",
  )}.`;
}

/** Build a canonical URL from a path. */
export function canonical(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BRAND.url}${clean === "/" ? "" : clean}`;
}

/**
 * Build a full {@link SeoMeta} for an arbitrary page.
 * `image` defaults to the brand OpenGraph card.
 */
export function buildSeoMeta(input: {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  answer: string;
  image?: string;
}): SeoMeta {
  const url = canonical(input.path);
  const title = clampTitle(input.title);
  const description = clampDescription(input.description);
  const image = input.image ?? `${BRAND.url}/opengraph-image`;
  return {
    title,
    description,
    canonical: url,
    keywords: input.keywords,
    answerSnippet: input.answer,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      image,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Derive {@link SeoMeta} for a generated article. */
export function articleSeoMeta(article: Article): SeoMeta {
  return buildSeoMeta({
    path: `/blog/${article.slug}`,
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.keywords,
    answer: article.faq[0]?.answer ?? article.excerpt,
  });
}

/** A URL-safe slug from a title. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/** Estimate word count of a Markdown body. */
export function wordCount(markdown: string): number {
  return markdown
    .replace(/[#*_`>\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}
