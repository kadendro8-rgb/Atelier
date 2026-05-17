/**
 * Content-calendar planner.
 *
 * Turns a date range into a concrete, evenly-spaced posting schedule —
 * platform cadence from `platforms.ts`, pillars rotated by their brand
 * weights, plus one weekly article. The planner is deterministic so the
 * same range always yields the same plan; the agent fills the prose.
 */
import { PILLARS } from "./brand";
import { PLATFORM_SPECS } from "./platforms";
import { PLATFORMS } from "./types";
import type { CalendarSlot, Platform } from "./types";

/** Add `n` days to an ISO `YYYY-MM-DD` date. */
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * A bag of pillar ids sized by brand weight — e.g. a 0.25-weight pillar
 * appears in ~25% of slots. Rotating through it gives a weighted mix.
 */
function pillarBag(): string[] {
  const bag: string[] = [];
  for (const p of PILLARS) {
    const n = Math.max(1, Math.round(p.weight * 20));
    for (let i = 0; i < n; i++) bag.push(p.id);
  }
  return bag;
}

/** Concrete theme prompts per pillar; the planner cycles through them. */
const THEME_BANK: Record<string, string[]> = {
  craft: [
    "Detail of an exterior wall section and why each layer is there",
    "How a roof pitch is chosen for the climate and the style",
    "A material pairing that reads premium without reading expensive",
    "Reading a window schedule — what egress really requires",
  ],
  process: [
    "A plain-language brief turning into a floor plan, step by step",
    "Before and after: a rough idea becoming permit-ready plans",
    "How a home is sited on the real lot with real setbacks",
    "From approved design to a portal that collects the deposit",
  ],
  "client-stories": [
    "A builder wins a project after a same-day plan turnaround",
    "A sloping lot solved with a stepped, multi-level plan",
    "A homeowner sees their home before committing a dollar",
    "An architect keeps full design control while moving faster",
  ],
  education: [
    "The three checks that tell you a floor plan actually works",
    "Bedroom egress, hallway width, ceiling height — the code basics",
    "How to read a site plan: setbacks, grade, and the buildable area",
    "What permit-ready actually means for a residential drawing set",
  ],
  "behind-the-scenes": [
    "The quiet checklist every Atelier plan passes before it ships",
    "Inside the studio standards for a render that earns trust",
    "Why we site on real terrain instead of a flat rectangle",
    "The taste layer: how a plan becomes a brand-grade deliverable",
  ],
};

export interface CalendarInput {
  /** ISO `YYYY-MM-DD` start date (inclusive). */
  startDate: string;
  /** Number of weeks to plan. */
  weeks: number;
  /** Platforms to schedule; defaults to all. */
  platforms?: Platform[];
}

/**
 * Plan a social posting calendar. Posts are spread across each week per
 * platform cadence, timed to each platform's best windows, and assigned a
 * weighted pillar + a concrete theme.
 */
export function planCalendar(input: CalendarInput): CalendarSlot[] {
  const platforms = input.platforms ?? PLATFORMS;
  const bag = pillarBag();
  const slots: CalendarSlot[] = [];
  let pillarCursor = 0;
  const themeCursor: Record<string, number> = {};

  for (let week = 0; week < input.weeks; week++) {
    const weekStart = addDays(input.startDate, week * 7);
    for (const platform of platforms) {
      const spec = PLATFORM_SPECS[platform];
      const cadence = spec.cadencePerWeek;
      for (let i = 0; i < cadence; i++) {
        const dayOffset = Math.min(6, Math.round((i * 7) / cadence));
        const pillar = bag[pillarCursor++ % bag.length];
        const themes = THEME_BANK[pillar] ?? THEME_BANK.craft;
        const tIdx = themeCursor[pillar] ?? 0;
        themeCursor[pillar] = tIdx + 1;
        slots.push({
          date: addDays(weekStart, dayOffset),
          time: spec.bestTimes[i % spec.bestTimes.length],
          platform,
          format: spec.formats[i % spec.formats.length],
          pillar,
          theme: themes[tIdx % themes.length],
        });
      }
    }
  }

  return slots.sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
  );
}

export interface ArticlePlanItem {
  publishDate: string;
  topic: string;
}

/** A rotating bank of article topics that promote the product honestly. */
const ARTICLE_TOPICS = [
  "How a conversation becomes a permit-ready custom-home design",
  "Siting a custom home on a real lot: setbacks, grade, and views",
  "What permit-ready means for a residential drawing set",
  "Reading a floor plan: the checks that catch problems early",
  "Custom-home design timelines, and where the weeks really go",
  "Photoreal renders that help a client say yes",
  "How builders win more projects with a same-day design",
  "Residential code basics every homeowner should understand",
];

/**
 * Plan one article per week. Topics rotate through {@link ARTICLE_TOPICS};
 * articles publish on the start-of-week date.
 */
export function planArticleSchedule(
  startDate: string,
  weeks: number,
): ArticlePlanItem[] {
  return Array.from({ length: weeks }, (_, week) => ({
    publishDate: addDays(startDate, week * 7),
    topic: ARTICLE_TOPICS[week % ARTICLE_TOPICS.length],
  }));
}
