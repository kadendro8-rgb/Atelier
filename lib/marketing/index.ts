/**
 * Atelier marketing engine — factory worker E2.
 *
 * A brand-grounded content engine: it generates accurate, on-brand social
 * posts, weekly articles, and ad creative; plans a posting calendar; emits
 * SEO / AEO / GEO metadata and local JSON-LD schema; and queues posts for
 * publishing through platform adapters.
 *
 * See `docs/factory/E2-marketing.md` for the worker spec and the run guide
 * for `scripts/marketing-agent.mjs`.
 */
export * from "./types";
export * from "./brand";
export * from "./platforms";
export {
  MarketingAgent,
  createMarketingAgent,
  type SocialBatchInput,
  type ArticleInput,
  type AdBatchInput,
} from "./agent";
export {
  planCalendar,
  planArticleSchedule,
  type CalendarInput,
  type ArticlePlanItem,
} from "./calendar";
export {
  PublishQueue,
  DryRunAdapter,
  dryRunAdapters,
} from "./queue";
export {
  buildSeoMeta,
  articleSeoMeta,
  answerSnippet,
  geoContext,
  canonical,
  slugify,
  wordCount,
  clampTitle,
  clampDescription,
} from "./seo";
export {
  localBusinessSchema,
  organizationSchema,
  webSiteSchema,
  breadcrumbSchema,
  faqSchema,
  articleSchema,
  serviceSchema,
  renderJsonLd,
  type JsonLd,
} from "./schema";
