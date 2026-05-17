/**
 * The Atelier marketing agent (factory worker E2).
 *
 * Server-side only. Wraps Claude with the same bounded-retry policy the
 * design-intake route uses, and produces brand-accurate social posts,
 * weekly articles, and ad creative. When no Anthropic key is configured —
 * or the API is unavailable — it falls back to the deterministic templates,
 * so the engine always returns valid, on-brand artifacts.
 */
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { PLATFORM_SPECS, trimToLimit } from "./platforms";
import {
  adSystemPrompt,
  articleSystemPrompt,
  socialSystemPrompt,
} from "./prompts";
import { slugify, wordCount } from "./seo";
import {
  fallbackAdCreatives,
  fallbackArticle,
  fallbackSocialPosts,
} from "./templates";
import { PILLARS, pillarById } from "./brand";
import type {
  AdCreative,
  AdObjective,
  Article,
  Platform,
  SocialPost,
} from "./types";

const MODEL = "claude-opus-4-7";
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoffMs = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000);

function headerValue(headers: unknown, name: string): string | null {
  if (!headers) return null;
  const maybe = headers as { get?: (k: string) => string | null };
  if (typeof maybe.get === "function") return maybe.get(name);
  const rec = headers as Record<string, string | undefined>;
  return rec[name] ?? rec[name.toLowerCase()] ?? null;
}

function retryAfterMs(headers: unknown): number {
  const secs = parseInt(headerValue(headers, "retry-after") ?? "", 10);
  return (Number.isFinite(secs) && secs > 0 ? Math.min(secs, 30) : 5) * 1000;
}

/* -------------------------------------------------------------------------- */
/* Structured-output schemas                                                  */
/* -------------------------------------------------------------------------- */

const SOCIAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    posts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          caption: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          altText: { type: "string" },
          cta: { type: "string" },
          assetBrief: { type: "string" },
          firstComment: { type: "string" },
        },
        required: ["caption", "hashtags", "altText", "cta", "assetBrief"],
      },
    },
  },
  required: ["posts"],
} as const;

const ARTICLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    metaTitle: { type: "string" },
    metaDescription: { type: "string" },
    excerpt: { type: "string" },
    body: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    faq: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "answer"],
      },
    },
  },
  required: [
    "title",
    "metaTitle",
    "metaDescription",
    "excerpt",
    "body",
    "keywords",
    "faq",
  ],
} as const;

const AD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ads: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          primaryText: { type: "string" },
          headline: { type: "string" },
          description: { type: "string" },
          cta: { type: "string" },
          audience: { type: "string" },
          assetBrief: { type: "string" },
        },
        required: [
          "primaryText",
          "headline",
          "description",
          "cta",
          "audience",
          "assetBrief",
        ],
      },
    },
  },
  required: ["ads"],
} as const;

/* -------------------------------------------------------------------------- */
/* Inputs                                                                      */
/* -------------------------------------------------------------------------- */

export interface SocialBatchInput {
  platform: Platform;
  /** Number of posts to produce. */
  count: number;
  /** Pillar id per post; rotates through all pillars when omitted. */
  pillars?: string[];
  /** Optional one-line theme per post. */
  themes?: string[];
}

export interface ArticleInput {
  /** The article topic / working title. */
  topic: string;
  /** ISO publish date; defaults to today. */
  publishDate?: string;
  keywords?: string[];
}

export interface AdBatchInput {
  platform: Platform;
  objective: AdObjective;
  /** Number of A/B variants (1–4). */
  variants: number;
}

/* -------------------------------------------------------------------------- */
/* Agent                                                                       */
/* -------------------------------------------------------------------------- */

const today = () => new Date().toISOString().slice(0, 10);

function asString(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function asStringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Strip leading `#`, lowercase, and de-dupe a hashtag list. */
function normalizeHashtags(raw: unknown, max: number): string[] {
  return [
    ...new Set(
      asStringList(raw).map((h) => h.replace(/^#+/, "").trim().toLowerCase()),
    ),
  ]
    .filter(Boolean)
    .slice(0, max);
}

export class MarketingAgent {
  private readonly client: Anthropic | null;

  constructor(apiKey: string | undefined = env.ANTHROPIC_API_KEY) {
    // maxRetries: 0 — the retry policy lives in `runStructured`.
    this.client = apiKey ? new Anthropic({ apiKey, maxRetries: 0 }) : null;
  }

  /** True when generation is model-backed rather than template-backed. */
  get modelEnabled(): boolean {
    return this.client !== null;
  }

  /** Call Claude for a JSON-schema-constrained result, with bounded retries. */
  private async runStructured(
    system: string,
    user: string,
    schema: Record<string, unknown>,
    opts: { maxTokens: number; effort: "low" | "medium" | "high" },
  ): Promise<unknown> {
    if (!this.client) throw new Error("Anthropic API key not configured");
    const client = this.client;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const message = await client.messages.create({
          model: MODEL,
          max_tokens: opts.maxTokens,
          output_config: {
            effort: opts.effort,
            format: { type: "json_schema", schema },
          },
          system: [
            { type: "text", text: system, cache_control: { type: "ephemeral" } },
          ],
          messages: [{ role: "user", content: user }],
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
          if (typeof status === "number" && status >= 400 && status < 500) {
            throw err;
          }
        }
        await sleep(backoffMs(attempt));
      }
    }
    throw new Error("Anthropic API unavailable after retries");
  }

  /** Generate a batch of social posts for one platform. */
  async generateSocialPosts(input: SocialBatchInput): Promise<SocialPost[]> {
    const count = Math.max(1, input.count);
    const pillarIds =
      input.pillars && input.pillars.length
        ? input.pillars
        : Array.from({ length: count }, (_, i) => PILLARS[i % PILLARS.length].id);
    const themes = input.themes ?? [];

    if (!this.client) {
      return fallbackSocialPosts(input.platform, count, pillarIds, themes);
    }

    const spec = PLATFORM_SPECS[input.platform];
    const slots = Array.from({ length: count }, (_, i) => {
      const pillar = pillarById(pillarIds[i % pillarIds.length]);
      const theme = themes[i] ? ` — theme: ${themes[i]}` : "";
      return `Post ${i + 1} — pillar: ${pillar.id} (${pillar.label})${theme}`;
    }).join("\n");

    try {
      const raw = await this.runStructured(
        socialSystemPrompt(input.platform),
        `Write ${count} ${spec.label} posts, one per line below, in order:\n${slots}`,
        SOCIAL_SCHEMA,
        { maxTokens: 3000, effort: "low" },
      );
      const posts = (raw as { posts?: unknown[] }).posts ?? [];
      if (!Array.isArray(posts) || posts.length === 0) {
        return fallbackSocialPosts(input.platform, count, pillarIds, themes);
      }
      const fallback = fallbackSocialPosts(input.platform, count, pillarIds, themes);
      return Array.from({ length: count }, (_, i) => {
        const r = (posts[i] ?? {}) as Record<string, unknown>;
        const base = fallback[i];
        const caption = asString(r.caption, base.caption);
        return {
          ...base,
          caption: trimToLimit(caption, input.platform),
          hashtags: r.hashtags
            ? normalizeHashtags(r.hashtags, spec.hashtags[1])
            : base.hashtags,
          altText: asString(r.altText, base.altText),
          cta: asString(r.cta, base.cta),
          assetBrief: asString(r.assetBrief, base.assetBrief),
          firstComment:
            typeof r.firstComment === "string" && r.firstComment.trim()
              ? r.firstComment
              : base.firstComment,
        } satisfies SocialPost;
      });
    } catch (err) {
      console.error("Marketing agent (social) fell back to templates:", err);
      return fallbackSocialPosts(input.platform, count, pillarIds, themes);
    }
  }

  /** Generate one weekly article. */
  async generateArticle(input: ArticleInput): Promise<Article> {
    const publishDate = input.publishDate ?? today();
    const keywords = input.keywords ?? [];

    if (!this.client) {
      return fallbackArticle(input.topic, publishDate, keywords);
    }

    try {
      const raw = (await this.runStructured(
        articleSystemPrompt(),
        `Topic / working title: ${input.topic}\n` +
          (keywords.length ? `Target keywords: ${keywords.join(", ")}` : ""),
        ARTICLE_SCHEMA,
        { maxTokens: 4096, effort: "medium" },
      )) as Record<string, unknown>;

      const fallback = fallbackArticle(input.topic, publishDate, keywords);
      const body = asString(raw.body, fallback.body);
      const title = asString(raw.title, fallback.title);
      const faq = Array.isArray(raw.faq)
        ? (raw.faq as Record<string, unknown>[])
            .map((f) => ({
              question: asString(f.question, ""),
              answer: asString(f.answer, ""),
            }))
            .filter((f) => f.question && f.answer)
        : fallback.faq;

      return {
        slug: slugify(title),
        title,
        metaTitle: asString(raw.metaTitle, fallback.metaTitle).slice(0, 60),
        metaDescription: asString(
          raw.metaDescription,
          fallback.metaDescription,
        ).slice(0, 160),
        excerpt: asString(raw.excerpt, fallback.excerpt),
        body,
        keywords: raw.keywords ? asStringList(raw.keywords) : fallback.keywords,
        faq: faq.length ? faq : fallback.faq,
        wordCount: wordCount(body),
        publishDate,
      };
    } catch (err) {
      console.error("Marketing agent (article) fell back to templates:", err);
      return fallbackArticle(input.topic, publishDate, keywords);
    }
  }

  /** Generate A/B ad creative for one platform + objective. */
  async generateAdCreatives(input: AdBatchInput): Promise<AdCreative[]> {
    const variants = Math.max(1, Math.min(input.variants, 4));

    if (!this.client) {
      return fallbackAdCreatives(input.platform, input.objective, variants);
    }

    try {
      const raw = await this.runStructured(
        adSystemPrompt(input.platform),
        `Write ${variants} distinct A/B ad variants. Objective: ${input.objective}.`,
        AD_SCHEMA,
        { maxTokens: 2048, effort: "low" },
      );
      const ads = (raw as { ads?: unknown[] }).ads ?? [];
      if (!Array.isArray(ads) || ads.length === 0) {
        return fallbackAdCreatives(input.platform, input.objective, variants);
      }
      const fallback = fallbackAdCreatives(input.platform, input.objective, variants);
      return Array.from({ length: variants }, (_, i) => {
        const r = (ads[i] ?? {}) as Record<string, unknown>;
        const base = fallback[i];
        return {
          ...base,
          primaryText: asString(r.primaryText, base.primaryText),
          headline: asString(r.headline, base.headline),
          description: asString(r.description, base.description),
          cta: asString(r.cta, base.cta),
          audience: asString(r.audience, base.audience),
          assetBrief: asString(r.assetBrief, base.assetBrief),
        } satisfies AdCreative;
      });
    } catch (err) {
      console.error("Marketing agent (ads) fell back to templates:", err);
      return fallbackAdCreatives(input.platform, input.objective, variants);
    }
  }
}

/** Construct a {@link MarketingAgent} using the configured environment. */
export function createMarketingAgent(): MarketingAgent {
  return new MarketingAgent();
}
