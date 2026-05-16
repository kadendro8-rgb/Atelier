// Shared design model for the Atelier builder flow.
// The AI route and the client both produce `BriefParams`; everything
// downstream (floor plan, site, renders, pricing) is derived deterministically.

export type StyleId =
  | "modern-farmhouse"
  | "lake-home"
  | "courtyard-modern"
  | "mountain-cabin"
  | "coastal-cottage"
  | "desert-contemporary"
  | "craftsman-bungalow"
  | "prairie-ranch"
  | "hillside-villa"
  | "urban-infill";

export type StyleInfo = {
  id: StyleId;
  label: string;
  image: string;
  blurb: string;
};

export const STYLES: StyleInfo[] = [
  {
    id: "modern-farmhouse",
    label: "Modern Farmhouse",
    image: "/showcase/showcase-modern-farmhouse.jpg",
    blurb: "Board-and-batten, a vaulted great room, and a deep wraparound porch.",
  },
  {
    id: "lake-home",
    label: "Lake Home",
    image: "/showcase/showcase-lake-home.jpg",
    blurb: "Lake-facing glass, a walkout lower level, and a screened upper deck.",
  },
  {
    id: "courtyard-modern",
    label: "Courtyard Modern",
    image: "/showcase/showcase-courtyard-modern.jpg",
    blurb: "An L-shaped plan wrapped around a private central courtyard.",
  },
  {
    id: "mountain-cabin",
    label: "Mountain Cabin",
    image: "/showcase/showcase-mountain-cabin.jpg",
    blurb: "A steep-roof timber frame engineered for heavy snow load.",
  },
  {
    id: "coastal-cottage",
    label: "Coastal Cottage",
    image: "/showcase/showcase-coastal-cottage.jpg",
    blurb: "Elevated pilings, hurricane-rated openings, and a shaded porch.",
  },
  {
    id: "desert-contemporary",
    label: "Desert Contemporary",
    image: "/showcase/showcase-desert-contemporary.jpg",
    blurb: "Low-slope roofs, deep overhangs, and a shaded ramada.",
  },
  {
    id: "craftsman-bungalow",
    label: "Craftsman Bungalow",
    image: "/showcase/showcase-craftsman-bungalow.jpg",
    blurb: "Tapered columns, exposed rafter tails, and a built-in entry bench.",
  },
  {
    id: "prairie-ranch",
    label: "Prairie Ranch",
    image: "/showcase/showcase-prairie-ranch.jpg",
    blurb: "A long, low horizontal massing with a split-bedroom layout.",
  },
  {
    id: "hillside-villa",
    label: "Hillside Villa",
    image: "/showcase/showcase-hillside-villa.jpg",
    blurb: "A stepped, multi-level plan that follows a downhill grade.",
  },
  {
    id: "urban-infill",
    label: "Urban Infill",
    image: "/showcase/showcase-urban-infill.jpg",
    blurb: "A narrow stacked plan with a rooftop terrace and a ground ADU.",
  },
];

export const STYLE_IDS = STYLES.map((s) => s.id);

export type BriefParams = {
  style: StyleId;
  sqft: number;
  beds: number; // 3-5
  baths: number;
  stories: number; // 1-3
  garageBays: number; // 2-3
  lotAcres: number;
  features: string[];
  summary: string;
};

export type PlanOptions = {
  garageBays: number;
  porch: boolean;
  office: boolean;
};

export type RoomTone = "private" | "public" | "service" | "primary" | "outdoor";

export type Room = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: RoomTone;
};

export type FloorPlan = {
  width: number;
  height: number;
  rooms: Room[];
  level: string;
};

export type Design = {
  params: BriefParams;
  projectName: string;
  style: StyleInfo;
  renders: string[];
  pricing: {
    consultation: number;
    designDeposit: number;
    total: number;
  };
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/** Keyword-based brief parser used when the AI route is unavailable. */
export function parseBriefLocally(brief: string): BriefParams {
  const t = brief.toLowerCase();

  const styleMatch: [RegExp, StyleId][] = [
    [/farmhouse/, "modern-farmhouse"],
    [/lake|waterfront/, "lake-home"],
    [/courtyard/, "courtyard-modern"],
    [/cabin|mountain|chalet/, "mountain-cabin"],
    [/coastal|beach|cottage|shore/, "coastal-cottage"],
    [/desert|adobe|southwest/, "desert-contemporary"],
    [/craftsman|bungalow/, "craftsman-bungalow"],
    [/prairie|ranch/, "prairie-ranch"],
    [/hillside|villa|hill/, "hillside-villa"],
    [/urban|infill|city|townhouse/, "urban-infill"],
  ];
  let style: StyleId = "modern-farmhouse";
  for (const [re, id] of styleMatch) {
    if (re.test(t)) {
      style = id;
      break;
    }
  }

  const bedM = t.match(/(\d+)\s*(?:-|\s)?\s*bed/);
  const beds = clamp(bedM ? parseInt(bedM[1], 10) : 4, 3, 5);

  const bathM = t.match(/([\d.]+)\s*(?:-|\s)?\s*bath/);
  const baths = bathM ? clamp(parseFloat(bathM[1]), 1, 7) : Math.max(2, beds - 1);

  const sqftM = t.match(/([\d,]{3,6})\s*(?:sq|sf|square)/);
  const sqft = sqftM
    ? clamp(parseInt(sqftM[1].replace(/,/g, ""), 10), 900, 9000)
    : 2400 + (beds - 3) * 500;

  let stories = 1;
  if (/(two|2)[\s-]*stor/.test(t)) stories = 2;
  if (/(three|3)[\s-]*stor/.test(t)) stories = 3;
  if (/single|one[\s-]*stor|rambler|\branch\b/.test(t)) stories = 1;

  const garageBays = /(3|three)[\s-]*car/.test(t) ? 3 : 2;

  const lotM = t.match(/([\d.]+)\s*(?:ac\b|acre)/);
  const lotAcres = lotM ? clamp(parseFloat(lotM[1]), 0.05, 40) : 0.5;

  const featureMap: [RegExp, string][] = [
    [/porch|veranda/, "Covered porch"],
    [/office|study|den/, "Home office"],
    [/pool/, "Pool-ready site plan"],
    [/vault|cathedral/, "Vaulted great room"],
    [/basement|walkout|lower level/, "Finished lower level"],
    [/adu|guest house|casita/, "Detached ADU"],
    [/open (?:concept|kitchen|plan)/, "Open-concept living"],
  ];
  const features = featureMap
    .filter(([re]) => re.test(t))
    .map(([, label]) => label);

  const summary = brief.trim().replace(/\s+/g, " ").slice(0, 180) || "Custom home";

  return { style, sqft, beds, baths, stories, garageBays, lotAcres, features, summary };
}

/** Coerce a raw object (e.g. from the AI route) into a safe BriefParams. */
export function normalizeParams(raw: unknown, brief: string): BriefParams {
  const fallback = parseBriefLocally(brief);
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;

  const style = STYLE_IDS.includes(r.style as StyleId)
    ? (r.style as StyleId)
    : fallback.style;
  const num = (v: unknown, def: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : def;

  return {
    style,
    sqft: clamp(Math.round(num(r.sqft, fallback.sqft)), 900, 9000),
    beds: clamp(Math.round(num(r.beds, fallback.beds)), 3, 5),
    baths: clamp(num(r.baths, fallback.baths), 1, 7),
    stories: clamp(Math.round(num(r.stories, fallback.stories)), 1, 3),
    garageBays: clamp(Math.round(num(r.garageBays, fallback.garageBays)), 2, 3),
    lotAcres: clamp(num(r.lotAcres, fallback.lotAcres), 0.05, 40),
    features: Array.isArray(r.features)
      ? (r.features as unknown[])
          .filter((f): f is string => typeof f === "string")
          .slice(0, 8)
      : fallback.features,
    summary:
      typeof r.summary === "string" && r.summary.trim()
        ? r.summary.trim().slice(0, 180)
        : fallback.summary,
  };
}

const STREETS = [
  "Cedar Lane",
  "Marlowe Ridge",
  "Hollow Creek",
  "Birchwood",
  "Stonegate",
  "Fieldstone",
  "Larkspur",
  "Quarry Hill",
  "Wren Hollow",
  "Aspen Grove",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function buildDesign(params: BriefParams): Design {
  const style = STYLES.find((s) => s.id === params.style) ?? STYLES[0];
  const seed = hash(params.summary + params.style + params.sqft);
  const street = STREETS[seed % STREETS.length];
  const styleWord = style.label.split(" ").slice(-1)[0];
  const projectName = `${street} ${styleWord}`;

  const designDeposit = Math.round((params.sqft * 2.9) / 250) * 250;
  const consultation = 850;

  const others = STYLES.filter((s) => s.id !== style.id).map((s) => s.image);
  const renders = [style.image, ...others].slice(0, 6);

  return {
    params,
    projectName,
    style,
    renders,
    pricing: {
      consultation,
      designDeposit,
      total: consultation + designDeposit,
    },
  };
}

/** Parametric single-level floor plan derived from the brief + live edits. */
export function buildFloorPlan(
  params: BriefParams,
  opts: PlanOptions,
): FloorPlan {
  const D = 200;
  const garageW = opts.garageBays === 3 ? 258 : 172;
  const primaryW = 232;
  const coreW = 470;
  const greatW = 286;
  const wingW = coreW - greatW;
  const W = garageW + coreW + primaryW;
  const topH = 84;

  const rooms: Room[] = [];

  rooms.push({
    id: "garage",
    label: `${opts.garageBays}-Car Garage`,
    x: 0,
    y: 0,
    w: garageW,
    h: D,
    tone: "service",
  });

  // Core top band
  rooms.push({ id: "foyer", label: "Foyer", x: garageW, y: 0, w: 110, h: topH, tone: "service" });
  rooms.push({ id: "kitchen", label: "Kitchen", x: garageW + 110, y: 0, w: 158, h: topH, tone: "public" });

  const diningX = garageW + 268;
  const diningRegion = coreW - 268;
  if (opts.office) {
    rooms.push({ id: "dining", label: "Dining", x: diningX, y: 0, w: 110, h: topH, tone: "public" });
    rooms.push({ id: "study", label: "Study", x: diningX + 110, y: 0, w: diningRegion - 110, h: topH, tone: "private" });
  } else {
    rooms.push({ id: "dining", label: "Dining", x: diningX, y: 0, w: diningRegion, h: topH, tone: "public" });
  }

  // Great room
  rooms.push({
    id: "great",
    label: params.features.some((f) => /vault/i.test(f)) ? "Vaulted Great Room" : "Great Room",
    x: garageW,
    y: topH,
    w: greatW,
    h: D - topH,
    tone: "public",
  });

  // Secondary bedroom wing
  const wingX = garageW + greatW;
  rooms.push({ id: "hall-bath", label: "Hall Bath", x: wingX, y: topH, w: wingW, h: 40, tone: "service" });
  const secondary = params.beds - 1;
  const bedTop = topH + 40;
  const bedH = (D - bedTop) / secondary;
  for (let i = 0; i < secondary; i++) {
    rooms.push({
      id: `bed-${i + 2}`,
      label: `Bedroom ${i + 2}`,
      x: wingX,
      y: bedTop + i * bedH,
      w: wingW,
      h: bedH,
      tone: "private",
    });
  }

  // Primary suite
  const px = garageW + coreW;
  rooms.push({ id: "primary", label: "Primary Suite", x: px, y: 0, w: primaryW, h: 116, tone: "primary" });
  rooms.push({ id: "ensuite", label: "Ensuite", x: px, y: 116, w: 132, h: D - 116, tone: "service" });
  rooms.push({ id: "closet", label: "Walk-in", x: px + 132, y: 116, w: primaryW - 132, h: D - 116, tone: "service" });

  let height = D;
  if (opts.porch) {
    rooms.push({
      id: "porch",
      label: "Covered Porch",
      x: garageW,
      y: D,
      w: coreW,
      h: 62,
      tone: "outdoor",
    });
    height = D + 62;
  }

  return {
    width: W,
    height,
    rooms,
    level: params.stories > 1 ? `Main level · 1 of ${params.stories}` : "Main level",
  };
}
