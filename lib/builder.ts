// Shared model for the multi-step builder flow. The parse-brief API route
// and the floor-plan step both work with `ParsedRequirements`.

export type ParsedRequirements = {
  sqft: number;
  beds: number;
  baths: number;
  style: string;
  story_count: number;
  lot_size: string;
  must_haves: string[];
  optional_features: string[];
  code_jurisdiction_hint: string;
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

const STYLE_PATTERNS: [RegExp, string][] = [
  [/farmhouse/, "modern farmhouse"],
  [/lake|waterfront/, "lake home"],
  [/courtyard/, "courtyard modern"],
  [/cabin|chalet|mountain/, "mountain cabin"],
  [/coastal|beach|shore|cottage/, "coastal cottage"],
  [/desert|adobe|southwest/, "desert contemporary"],
  [/craftsman|bungalow/, "craftsman bungalow"],
  [/prairie|ranch|rambler/, "prairie ranch"],
  [/hillside|villa/, "hillside villa"],
  [/urban|infill|townhouse/, "urban infill"],
  [/modern|contemporary/, "modern"],
];

const FEATURE_PATTERNS: [RegExp, string][] = [
  [/vault|cathedral/, "vaulted great room"],
  [/porch|veranda/, "covered porch"],
  [/office|study|den/, "home office"],
  [/walk-?out|basement|lower level/, "walkout lower level"],
  [/pool/, "pool-ready site"],
  [/open[\s-](?:concept|plan|kitchen)/, "open-concept living"],
  [/screened|sunroom/, "screened porch"],
  [/glass|window wall/, "expansive glazing"],
];

/** Keyword brief parser used when the AI route is unavailable. */
export function parseBriefFallback(brief: string): ParsedRequirements {
  const t = brief.toLowerCase();

  const bedMatch = t.match(/(\d+)\s*-?\s*bed/);
  const beds = clamp(bedMatch ? parseInt(bedMatch[1], 10) : 3, 1, 8);

  const bathMatch = t.match(/([\d.]+)\s*-?\s*bath/);
  const baths = bathMatch
    ? clamp(parseFloat(bathMatch[1]), 1, 9)
    : Math.max(2, beds - 1);

  const sqftMatch = t.match(/([\d,]{3,6})\s*(?:sq|sf|square)/);
  const sqft = sqftMatch
    ? clamp(parseInt(sqftMatch[1].replace(/,/g, ""), 10), 600, 12000)
    : 1500 + beds * 400;

  const story_count = /\b(three|3)[\s-]*stor/.test(t)
    ? 3
    : /\b(two|2)[\s-]*stor|walk-?out/.test(t)
      ? 2
      : 1;

  const style =
    STYLE_PATTERNS.find(([re]) => re.test(t))?.[1] ?? "transitional";

  const lotMatch = t.match(/([\d.]+)\s*-?\s*(?:ac\b|acre)/);
  const lot_size = lotMatch ? `${lotMatch[1]} acres` : "0.5 acres";

  const must_haves = [
    ...new Set(
      FEATURE_PATTERNS.filter(([re]) => re.test(t)).map(([, label]) => label),
    ),
  ].slice(0, 6);

  return {
    sqft,
    beds,
    baths,
    style,
    story_count,
    lot_size,
    must_haves,
    optional_features: [],
    code_jurisdiction_hint: "IRC 2021",
  };
}
