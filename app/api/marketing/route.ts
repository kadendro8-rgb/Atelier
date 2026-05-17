/**
 * Marketing engine HTTP surface.
 *
 * The in-app and CLI entry point for factory worker E2. POST an `action` and
 * its parameters; the route runs the marketing engine server-side (so the
 * Anthropic key never reaches the client) and returns JSON artifacts —
 * calendar, social posts, articles, ad creative, and JSON-LD schema.
 *
 * Drives `scripts/marketing-agent.mjs`. See `docs/factory/E2-marketing.md`.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PLATFORMS,
  articleSchema,
  articleSeoMeta,
  createMarketingAgent,
  faqSchema,
  localBusinessSchema,
  organizationSchema,
  planArticleSchedule,
  planCalendar,
  serviceSchema,
  webSiteSchema,
} from "@/lib/marketing";
import type { CalendarSlot, Platform, SocialPost } from "@/lib/marketing";

export const runtime = "nodejs";

const platformEnum = z.enum(PLATFORMS as [Platform, ...Platform[]]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("calendar"),
    startDate: isoDate,
    weeks: z.number().int().min(1).max(13),
    platforms: z.array(platformEnum).optional(),
  }),
  z.object({
    action: z.literal("posts"),
    platform: platformEnum,
    count: z.number().int().min(1).max(20),
    pillars: z.array(z.string()).optional(),
    themes: z.array(z.string()).optional(),
  }),
  z.object({
    action: z.literal("article"),
    topic: z.string().min(3),
    publishDate: isoDate.optional(),
    keywords: z.array(z.string()).optional(),
  }),
  z.object({
    action: z.literal("ads"),
    platform: platformEnum,
    objective: z.enum([
      "awareness",
      "traffic",
      "engagement",
      "leads",
      "conversions",
    ]),
    variants: z.number().int().min(1).max(4),
  }),
  z.object({ action: z.literal("schema") }),
  z.object({
    action: z.literal("plan"),
    startDate: isoDate,
    weeks: z.number().int().min(1).max(13),
    platforms: z.array(platformEnum).optional(),
  }),
]);

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "malformed JSON body" },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const agent = createMarketingAgent();
  const meta = { ok: true as const, modelEnabled: agent.modelEnabled };

  try {
    switch (input.action) {
      case "schema":
        return NextResponse.json({
          ...meta,
          schema: {
            localBusiness: localBusinessSchema(),
            organization: organizationSchema(),
            website: webSiteSchema(),
            service: serviceSchema(),
          },
        });

      case "calendar":
        return NextResponse.json({
          ...meta,
          calendar: planCalendar(input),
          articles: planArticleSchedule(input.startDate, input.weeks),
        });

      case "posts":
        return NextResponse.json({
          ...meta,
          posts: await agent.generateSocialPosts(input),
        });

      case "ads":
        return NextResponse.json({
          ...meta,
          ads: await agent.generateAdCreatives(input),
        });

      case "article": {
        const article = await agent.generateArticle(input);
        return NextResponse.json({
          ...meta,
          article,
          seo: articleSeoMeta(article),
          schema: {
            article: articleSchema(article),
            faq: faqSchema(article.faq),
          },
        });
      }

      case "plan": {
        const calendar = planCalendar(input);
        const articles = planArticleSchedule(input.startDate, input.weeks);
        // Generate concrete posts for the first week's slots only — the rest
        // of the calendar stays as themed slots to keep one request bounded.
        const firstWeek = calendar.filter(
          (s) => s.date < addDaysIso(input.startDate, 7),
        );
        const posts: { slot: CalendarSlot; post: SocialPost }[] = [];
        for (const slot of firstWeek) {
          const [post] = await agent.generateSocialPosts({
            platform: slot.platform,
            count: 1,
            pillars: [slot.pillar],
            themes: [slot.theme],
          });
          posts.push({ slot, post });
        }
        const article = await agent.generateArticle({
          topic: articles[0].topic,
          publishDate: articles[0].publishDate,
        });
        return NextResponse.json({
          ...meta,
          calendar,
          articles,
          firstWeekPosts: posts,
          firstArticle: article,
        });
      }
    }
  } catch (err) {
    console.error("Marketing route failed:", err);
    return NextResponse.json(
      { ok: false, error: "marketing engine error" },
      { status: 500 },
    );
  }
}

/** Add `n` days to an ISO date — local helper for the `plan` window. */
function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
