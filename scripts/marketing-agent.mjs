#!/usr/bin/env node
/**
 * Atelier marketing agent — CLI runner (factory worker E2).
 *
 * A thin client for the `/api/marketing` route: it builds a request, calls
 * the running Next server, and writes the generated artifacts to disk.
 *
 *   1. Start the app:   npm run dev      (or: npm run build && npm start)
 *   2. Run the agent:   node scripts/marketing-agent.mjs <action> [flags]
 *
 * Actions:
 *   plan       Full content plan — calendar + first-week posts + first article
 *   calendar   Posting calendar + weekly article schedule
 *   posts      A batch of social posts for one platform
 *   article    One weekly article (Markdown + SEO metadata + JSON-LD)
 *   ads        A/B ad creative for one platform
 *   schema     Local-business / organization JSON-LD
 *
 * Flags (all optional unless noted):
 *   --start YYYY-MM-DD   Calendar start date (default: today)
 *   --weeks N            Weeks to plan (default: 4)
 *   --platform NAME      Platform for posts/ads (default: instagram)
 *   --platforms a,b,c    Platforms for calendar/plan (default: all)
 *   --count N            Posts to generate (default: 5)
 *   --pillars a,b        Pillar ids, comma-separated
 *   --topic "..."        Article topic (required for `article`)
 *   --keywords a,b       Article target keywords
 *   --objective NAME     Ad objective (default: traffic)
 *   --variants N         Ad variants (default: 2)
 *   --out DIR            Output directory (default: marketing/out)
 *
 * Environment:
 *   MARKETING_API_URL    Base URL of the running app (default: http://localhost:3000)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const API_BASE = process.env.MARKETING_API_URL ?? "http://localhost:3000";

/** Parse `--flag value` / `--flag` pairs into an object. */
function parseArgs(argv) {
  const [action, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i++) {
    if (!rest[i].startsWith("--")) continue;
    const key = rest[i].slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i++;
    }
  }
  return { action, flags };
}

const today = () => new Date().toISOString().slice(0, 10);
const list = (v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined);
const num = (v, d) => (v === undefined ? d : Number(v));

/** Build the API request body for an action from CLI flags. */
function buildBody(action, f) {
  switch (action) {
    case "plan":
    case "calendar":
      return {
        action,
        startDate: f.start ?? today(),
        weeks: num(f.weeks, 4),
        platforms: list(f.platforms),
      };
    case "posts":
      return {
        action,
        platform: f.platform ?? "instagram",
        count: num(f.count, 5),
        pillars: list(f.pillars),
        themes: list(f.themes),
      };
    case "article":
      if (!f.topic) throw new Error("`article` requires --topic \"...\"");
      return {
        action,
        topic: String(f.topic),
        publishDate: f.publishDate,
        keywords: list(f.keywords),
      };
    case "ads":
      return {
        action,
        platform: f.platform ?? "instagram",
        objective: f.objective ?? "traffic",
        variants: num(f.variants, 2),
      };
    case "schema":
      return { action: "schema" };
    default:
      throw new Error(`unknown action "${action}"`);
  }
}

/** A YAML-ish frontmatter + body Markdown file for an article. */
function articleMarkdown(article, seo) {
  return [
    "---",
    `title: ${JSON.stringify(article.title)}`,
    `slug: ${article.slug}`,
    `publishDate: ${article.publishDate}`,
    `metaTitle: ${JSON.stringify(seo?.title ?? article.metaTitle)}`,
    `metaDescription: ${JSON.stringify(seo?.description ?? article.metaDescription)}`,
    `keywords: ${JSON.stringify(article.keywords)}`,
    `wordCount: ${article.wordCount}`,
    "---",
    "",
    article.body,
    "",
  ].join("\n");
}

async function main() {
  const { action, flags } = parseArgs(process.argv.slice(2));
  if (!action || action === "help" || flags.help) {
    console.log("Usage: node scripts/marketing-agent.mjs <action> [flags]");
    console.log("Actions: plan | calendar | posts | article | ads | schema");
    console.log("See the header of this file for the full flag list.");
    process.exit(action ? 0 : 1);
  }

  const body = buildBody(action, flags);
  const url = `${API_BASE}/api/marketing`;
  console.log(`→ ${action}  (${url})`);

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`\n✗ Could not reach ${url}`);
    console.error("  Start the app first:  npm run dev");
    console.error(`  Or set MARKETING_API_URL to the deployed app.\n  (${err.message})`);
    process.exit(1);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    console.error(`✗ API error (${res.status}): ${data.error ?? "unknown"}`);
    process.exit(1);
  }

  const outDir = join(ROOT, String(flags.out ?? "marketing/out"));
  await mkdir(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  const jsonPath = join(outDir, `${action}-${stamp}.json`);
  await writeFile(jsonPath, JSON.stringify(data, null, 2));
  console.log(`✓ wrote ${jsonPath}`);

  if (action === "article" && data.article) {
    const mdPath = join(outDir, `${data.article.slug}.md`);
    await writeFile(mdPath, articleMarkdown(data.article, data.seo));
    console.log(`✓ wrote ${mdPath}`);
  }
  if (action === "plan" && data.firstArticle) {
    const mdPath = join(outDir, `${data.firstArticle.slug}.md`);
    await writeFile(mdPath, articleMarkdown(data.firstArticle));
    console.log(`✓ wrote ${mdPath}`);
  }

  // Console summary.
  console.log(data.modelEnabled
    ? "  generation: Claude (ANTHROPIC_API_KEY set)"
    : "  generation: deterministic templates (no ANTHROPIC_API_KEY)");
  if (data.calendar) console.log(`  calendar slots: ${data.calendar.length}`);
  if (data.articles) console.log(`  weekly articles: ${data.articles.length}`);
  if (data.posts) console.log(`  posts: ${data.posts.length}`);
  if (data.firstWeekPosts) console.log(`  first-week posts: ${data.firstWeekPosts.length}`);
  if (data.ads) console.log(`  ad variants: ${data.ads.length}`);
  if (action === "schema") console.log("  schema: localBusiness, organization, website, service");
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
