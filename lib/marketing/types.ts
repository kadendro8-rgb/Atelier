/**
 * Shared content model for the Atelier marketing engine (factory worker E2).
 *
 * Every artifact the engine produces — social posts, articles, ad creative,
 * SEO metadata, calendar slots — is described here so the generator, the
 * calendar planner, the publish queue, and the CLI all speak the same shape.
 */

/** Social platforms the engine writes for. */
export type Platform =
  | "instagram"
  | "facebook"
  | "x"
  | "linkedin"
  | "tiktok"
  | "pinterest"
  | "threads"
  | "youtube";

/** The list form of {@link Platform}, for iteration and validation. */
export const PLATFORMS: Platform[] = [
  "instagram",
  "facebook",
  "x",
  "linkedin",
  "tiktok",
  "pinterest",
  "threads",
  "youtube",
];

/** Creative format a post is produced in. */
export type ContentFormat =
  | "single-image"
  | "carousel"
  | "story"
  | "reel"
  | "short-video"
  | "text"
  | "link";

/** Lifecycle of a queued post. */
export type PublishStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

/** What an ad is optimised for. */
export type AdObjective =
  | "awareness"
  | "traffic"
  | "engagement"
  | "leads"
  | "conversions";

/** A direct-answer block for Answer Engine Optimization (AEO). */
export interface FaqItem {
  question: string;
  answer: string;
}

/** A single social post, ready for a platform adapter to publish. */
export interface SocialPost {
  id: string;
  platform: Platform;
  format: ContentFormat;
  /** The pillar id this post belongs to (see `brand.ts`). */
  pillar: string;
  /** Post body / caption, already trimmed to the platform limit. */
  caption: string;
  /** Hashtags without the leading `#`. */
  hashtags: string[];
  /** Accessibility alt text for the lead visual. */
  altText: string;
  /** The call to action embedded in the post. */
  cta: string;
  /** Plain-language brief for the visual a designer / image model produces. */
  assetBrief: string;
  /** Optional seeded first comment (link drop, extra hashtags). */
  firstComment?: string;
}

/** A long-form article that promotes the product and ranks. */
export interface Article {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  /** Article body as Markdown. */
  body: string;
  keywords: string[];
  /** AEO question/answer pairs, also used for FAQPage schema. */
  faq: FaqItem[];
  wordCount: number;
  /** ISO date the article is intended to publish. */
  publishDate: string;
}

/** A single ad creative, one A/B variant. */
export interface AdCreative {
  id: string;
  platform: Platform;
  objective: AdObjective;
  /** Variant label, e.g. `"A"`, `"B"`. */
  variant: string;
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  /** Plain-language audience definition for the ad manager. */
  audience: string;
  assetBrief: string;
}

/** Resolved SEO / AEO / GEO metadata for a page. */
export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: string;
    image: string;
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string;
  };
  /** AEO/GEO: a 40–55 word direct answer for snippet and LLM citation. */
  answerSnippet: string;
}

/** One scheduled slot in the content calendar. */
export interface CalendarSlot {
  /** ISO date (`YYYY-MM-DD`). */
  date: string;
  /** Local 24h time (`HH:mm`). */
  time: string;
  platform: Platform;
  format: ContentFormat;
  pillar: string;
  /** One-line theme prompt for the generator. */
  theme: string;
}

/** A post entered into the publish queue. */
export interface PublishJob {
  id: string;
  post: SocialPost;
  status: PublishStatus;
  /** ISO datetime the job should publish at. */
  scheduledFor: string;
  /** Platform-side id once published. */
  externalId?: string;
  /** Failure reason when `status` is `"failed"`. */
  error?: string;
  attempts: number;
}

/** Result returned by a platform adapter. */
export interface PublishResult {
  ok: boolean;
  externalId?: string;
  /** Public URL of the published post, when the adapter can resolve one. */
  url?: string;
  error?: string;
}

/** Publishes a post to one platform. Implemented per platform. */
export interface PublishAdapter {
  readonly platform: Platform;
  /** True when real credentials are configured; false for dry-run. */
  readonly live: boolean;
  publish(post: SocialPost): Promise<PublishResult>;
}
