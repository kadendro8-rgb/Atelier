/**
 * The single source of truth for the Atelier brand.
 *
 * Everything the marketing engine produces is grounded in this file: voice,
 * pillars, audience, banned language, the local-business record for schema,
 * and the social handles. Change the brand here, not in prompts or templates.
 */

/** Core brand identity. */
export const BRAND = {
  name: "Atelier",
  legalName: "Atelier Design, Inc.",
  url: "https://atelier.design",
  logo: "https://atelier.design/icon.svg",
  tagline: "Design custom homes in an afternoon, not a quarter.",
  /**
   * The aspirational reference: a premium lifestyle brand presence in the
   * spirit of Lululemon or Alo — calm, confident, craft-forward, never loud.
   */
  positioning:
    "The premium design studio for custom homes — a conversation becomes " +
    "permit-ready plans, photoreal renders, and a paid deposit.",
  /** One-sentence elevator line, reused in bios and OpenGraph. */
  elevator:
    "Atelier turns a client conversation into permit-ready custom-home " +
    "designs — floor plans, site plans, photoreal renders, and a portal " +
    "that collects the deposit.",
} as const;

/**
 * Brand voice. The engine reads these to keep every platform on point.
 * Tone target: the quiet confidence of a high-end atelier — Lululemon/Alo
 * for the homebuilding world.
 */
export const VOICE = {
  attributes: [
    "calm",
    "confident",
    "craft-forward",
    "precise",
    "warm but not chatty",
    "expert, never salesy",
  ],
  /** Phrases and habits that are off-brand — the engine must avoid these. */
  banned: [
    "game-changer",
    "revolutionary",
    "disrupt",
    "unlock",
    "supercharge",
    "!!!",
    "ALL CAPS shouting",
    "hustle",
    "🔥 / spammy emoji walls",
    "fake scarcity ('only 3 left')",
  ],
  /** Hard rules the engine applies to every artifact. */
  rules: [
    "Lead with craft and the client outcome, not the software.",
    "One idea per post. Specific beats clever.",
    "At most one emoji, and only when it earns its place.",
    "Never overpromise timelines or permit outcomes.",
    "Show the work — plans, renders, sites — over stock language.",
    "Sentence case for headlines. No exclamation pile-ups.",
  ],
} as const;

/** A content pillar — the recurring themes the calendar rotates through. */
export interface ContentPillar {
  id: string;
  label: string;
  /** What this pillar is for and how it should feel. */
  intent: string;
  /** Rough share of the calendar, 0–1. Pillar weights should sum to ~1. */
  weight: number;
}

export const PILLARS: ContentPillar[] = [
  {
    id: "craft",
    label: "The craft",
    intent:
      "Show the detail and discipline of a real design — a wall section, a " +
      "site decision, a material call. Aspirational, quiet, expert.",
    weight: 0.25,
  },
  {
    id: "process",
    label: "Conversation to plans",
    intent:
      "Demonstrate the Atelier loop: a brief becomes plans, renders, and a " +
      "deposit. Before/after, time-lapse, the speed without the corner-cutting.",
    weight: 0.2,
  },
  {
    id: "client-stories",
    label: "Client + builder stories",
    intent:
      "Real builders and homeowners, real lots, real outcomes. Human, warm, " +
      "credible. The proof the product works.",
    weight: 0.2,
  },
  {
    id: "education",
    label: "Design education",
    intent:
      "Teach something useful — code requirements, site siting, how to read " +
      "a plan. Earns trust and drives search/answer-engine visibility.",
    weight: 0.2,
  },
  {
    id: "behind-the-scenes",
    label: "Inside the atelier",
    intent:
      "The studio, the team, the standards. Builds the brand as a place with " +
      "taste — the Lululemon/Alo lifestyle layer.",
    weight: 0.15,
  },
];

/** Audience personas the engine writes toward. */
export const AUDIENCE = [
  {
    id: "builder",
    label: "Custom-home builder",
    cares: "winning the client, fast turnarounds, looking premium, margin",
  },
  {
    id: "architect",
    label: "Residential architect / designer",
    cares: "design control, code accuracy, owning their files, no lock-in",
  },
  {
    id: "homeowner",
    label: "Prospective custom-home owner",
    cares: "seeing their home before committing, cost clarity, trust",
  },
] as const;

/**
 * The local-business record for LocalBusiness / Organization JSON-LD.
 *
 * NOTE: address, telephone and geo are placeholders for the marketing-launch
 * checklist — the foreman must confirm the registered studio address before
 * local schema and GEO citations go live.
 */
export const BUSINESS = {
  name: BRAND.name,
  legalName: BRAND.legalName,
  description: BRAND.elevator,
  url: BRAND.url,
  logo: BRAND.logo,
  email: "studio@atelier.design",
  telephone: "+1-317-555-0100",
  priceRange: "$$$",
  foundingDate: "2025",
  address: {
    streetAddress: "1 Studio Way",
    addressLocality: "Indianapolis",
    addressRegion: "IN",
    postalCode: "46204",
    addressCountry: "US",
  },
  geo: { latitude: 39.7684, longitude: -86.1581 },
  /** Cities / regions served — drives GEO (local) targeting. */
  areaServed: ["Indiana", "Midwest United States"],
} as const;

/** Public social profiles, used for `sameAs` and cross-links. */
export const SOCIAL_HANDLES: Record<string, string> = {
  instagram: "https://instagram.com/atelier.design",
  facebook: "https://facebook.com/atelier.design",
  x: "https://x.com/atelierdesign",
  linkedin: "https://linkedin.com/company/atelier-design",
  tiktok: "https://tiktok.com/@atelier.design",
  pinterest: "https://pinterest.com/atelierdesign",
  threads: "https://threads.net/@atelier.design",
  youtube: "https://youtube.com/@atelier.design",
};

/** Evergreen, on-brand hashtags. The engine mixes these with topical tags. */
export const CORE_HASHTAGS = [
  "customhome",
  "customhomedesign",
  "homedesign",
  "architecture",
  "floorplans",
  "homebuilder",
  "residentialarchitecture",
  "dreamhome",
];

/** Look up a pillar by id, falling back to the first pillar. */
export function pillarById(id: string): ContentPillar {
  return PILLARS.find((p) => p.id === id) ?? PILLARS[0];
}
