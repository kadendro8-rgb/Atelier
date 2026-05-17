/**
 * Per-platform specifications.
 *
 * The generator trims captions, picks hashtag counts, and chooses formats
 * from this table; the calendar planner reads `cadencePerWeek` to size the
 * schedule. Limits are deliberately conservative so output is always valid.
 */
import type { ContentFormat, Platform } from "./types";

export interface PlatformSpec {
  platform: Platform;
  label: string;
  /** Hard caption character limit the generator trims to. */
  captionLimit: number;
  /** Recommended hashtag count `[min, max]`. */
  hashtags: [number, number];
  /** Formats this platform supports, best-first. */
  formats: ContentFormat[];
  /** Target posts per week for an enterprise-grade presence. */
  cadencePerWeek: number;
  /** Best-performing local posting times, 24h `HH:mm`. */
  bestTimes: string[];
  /** Lead image aspect ratio, `width:height`. */
  aspectRatio: string;
  /** Voice nudge specific to the platform's audience. */
  voiceNote: string;
}

export const PLATFORM_SPECS: Record<Platform, PlatformSpec> = {
  instagram: {
    platform: "instagram",
    label: "Instagram",
    captionLimit: 2200,
    hashtags: [8, 15],
    formats: ["carousel", "reel", "single-image", "story"],
    cadencePerWeek: 5,
    bestTimes: ["11:00", "19:00"],
    aspectRatio: "4:5",
    voiceNote:
      "Lead with the image. The caption is a quiet, confident caption — " +
      "the Lululemon/Alo register: aspirational, never salesy.",
  },
  facebook: {
    platform: "facebook",
    label: "Facebook",
    captionLimit: 2000,
    hashtags: [2, 4],
    formats: ["single-image", "link", "short-video", "carousel"],
    cadencePerWeek: 4,
    bestTimes: ["09:00", "13:00"],
    aspectRatio: "1.91:1",
    voiceNote:
      "Slightly more context than Instagram. Good for article shares and " +
      "client stories. Few hashtags.",
  },
  x: {
    platform: "x",
    label: "X",
    captionLimit: 280,
    hashtags: [0, 2],
    formats: ["text", "single-image", "link"],
    cadencePerWeek: 7,
    bestTimes: ["08:00", "12:00", "17:00"],
    aspectRatio: "16:9",
    voiceNote:
      "One sharp idea. Often a hook for a thread. Hashtags sparingly, if at all.",
  },
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    captionLimit: 3000,
    hashtags: [3, 5],
    formats: ["single-image", "text", "link", "carousel"],
    cadencePerWeek: 3,
    bestTimes: ["08:00", "12:00"],
    aspectRatio: "1.91:1",
    voiceNote:
      "Professional, builder/architect audience. Lead with the business " +
      "outcome — speed, margin, winning the client.",
  },
  tiktok: {
    platform: "tiktok",
    label: "TikTok",
    captionLimit: 2200,
    hashtags: [3, 6],
    formats: ["short-video", "reel"],
    cadencePerWeek: 4,
    bestTimes: ["12:00", "20:00"],
    aspectRatio: "9:16",
    voiceNote:
      "Hook in the first second. Process and before/after content. The " +
      "caption supports a video script.",
  },
  pinterest: {
    platform: "pinterest",
    label: "Pinterest",
    captionLimit: 500,
    hashtags: [2, 5],
    formats: ["single-image", "carousel"],
    cadencePerWeek: 5,
    bestTimes: ["14:00", "21:00"],
    aspectRatio: "2:3",
    voiceNote:
      "Search-driven and evergreen. Keyword-rich, descriptive — write for " +
      "the person planning a future home.",
  },
  threads: {
    platform: "threads",
    label: "Threads",
    captionLimit: 500,
    hashtags: [0, 1],
    formats: ["text", "single-image"],
    cadencePerWeek: 5,
    bestTimes: ["10:00", "18:00"],
    aspectRatio: "4:5",
    voiceNote:
      "Conversational and human. Inside-the-atelier moments do well. One " +
      "tag at most.",
  },
  youtube: {
    platform: "youtube",
    label: "YouTube",
    captionLimit: 5000,
    hashtags: [3, 6],
    formats: ["short-video"],
    cadencePerWeek: 1,
    bestTimes: ["16:00"],
    aspectRatio: "16:9",
    voiceNote:
      "Long-form walkthroughs and Shorts. The caption is a real description " +
      "with chapters and a clear CTA.",
  },
};

/** All platform specs as a list. */
export const ALL_SPECS: PlatformSpec[] = Object.values(PLATFORM_SPECS);

/** Trim a caption to a platform's hard limit on a word boundary. */
export function trimToLimit(text: string, platform: Platform): string {
  const limit = PLATFORM_SPECS[platform].captionLimit;
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
