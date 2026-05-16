/**
 * Mock data for the v2.0 moat pages (Section 7): stamp-partner dashboard,
 * builder-match, GC network, and the public design gallery. These routes are
 * presentational — there is no backend yet, so the data lives here as typed
 * fixtures. Real sources are tracked in docs/v2-spec.md section 7.
 */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Format an integer as whole-dollar currency. */
export function formatUsd(amount: number): string {
  return USD.format(amount);
}

/* -------------------------------------------------------------------------- */
/* Stamp-partner dashboard                                                    */
/* -------------------------------------------------------------------------- */

export type StampStatus = "new" | "in-review" | "ready";

export type StampProject = {
  id: string;
  builder: string;
  project: string;
  location: string;
  sqft: number;
  /** Architect's share of the stamp fee (80% of total; Atelier keeps 20%). */
  stampFee: number;
  deadline: string;
  status: StampStatus;
};

export const STAMP_QUEUE: StampProject[] = [
  {
    id: "ATL-2041",
    builder: "Hearthstone Builders",
    project: "Maple Ridge Farmhouse",
    location: "Zionsville, IN",
    sqft: 2940,
    stampFee: 1480,
    deadline: "May 21, 2026",
    status: "new",
  },
  {
    id: "ATL-2038",
    builder: "Lakeside Custom Homes",
    project: "Cormorant Point Lake House",
    location: "Culver, IN",
    sqft: 3610,
    stampFee: 1820,
    deadline: "May 19, 2026",
    status: "in-review",
  },
  {
    id: "ATL-2035",
    builder: "Timber & Stone Co.",
    project: "Hollowbrook Craftsman",
    location: "Carmel, IN",
    sqft: 1980,
    stampFee: 1010,
    deadline: "May 18, 2026",
    status: "ready",
  },
  {
    id: "ATL-2033",
    builder: "Northgate Residential",
    project: "Birchfield Modern Ranch",
    location: "Westfield, IN",
    sqft: 2460,
    stampFee: 1240,
    deadline: "May 24, 2026",
    status: "new",
  },
  {
    id: "ATL-2029",
    builder: "Hearthstone Builders",
    project: "Sycamore Court Transitional",
    location: "Fishers, IN",
    sqft: 3180,
    stampFee: 1600,
    deadline: "May 27, 2026",
    status: "in-review",
  },
];

/* -------------------------------------------------------------------------- */
/* Builder-match                                                              */
/* -------------------------------------------------------------------------- */

export type MatchedGc = {
  id: string;
  name: string;
  tagline: string;
  region: string;
  rating: number;
  reviews: number;
  homesBuilt: number;
  priceBand: string;
  specialties: string[];
};

export const MATCHED_GCS: MatchedGc[] = [
  {
    id: "gc-hearthstone",
    name: "Hearthstone Builders",
    tagline: "Fourth-generation custom homes with an in-house design studio.",
    region: "Greater Indianapolis",
    rating: 4.9,
    reviews: 132,
    homesBuilt: 410,
    priceBand: "$$$",
    specialties: ["Modern farmhouse", "Transitional", "Energy-efficient"],
  },
  {
    id: "gc-lakeside",
    name: "Lakeside Custom Homes",
    tagline: "Waterfront and walkout specialists across northern Indiana.",
    region: "Northern Indiana lakes",
    rating: 4.8,
    reviews: 87,
    homesBuilt: 220,
    priceBand: "$$$$",
    specialties: ["Lake homes", "Walkout basements", "Outdoor living"],
  },
  {
    id: "gc-northgate",
    name: "Northgate Residential",
    tagline: "Fixed-price custom builds with transparent allowances.",
    region: "Hamilton County",
    rating: 4.7,
    reviews: 154,
    homesBuilt: 530,
    priceBand: "$$",
    specialties: ["Ranch", "First-time custom", "Fixed-price"],
  },
];

/* -------------------------------------------------------------------------- */
/* Public design gallery                                                      */
/* -------------------------------------------------------------------------- */

export type GalleryProject = {
  id: string;
  title: string;
  style: string;
  region: string;
  /** Budget bracket label, also used as the budget filter key. */
  budget: string;
  sqft: number;
  beds: number;
  baths: number;
  builder: string;
  /** Two-stop gradient used as a stand-in for the project hero render. */
  swatch: [string, string];
};

export const GALLERY_PROJECTS: GalleryProject[] = [
  {
    id: "g-maple-ridge",
    title: "Maple Ridge Farmhouse",
    style: "Modern farmhouse",
    region: "Midwest",
    budget: "$600k–$850k",
    sqft: 2940,
    beds: 4,
    baths: 3,
    builder: "Hearthstone Builders",
    swatch: ["#3a2f22", "#d28a55"],
  },
  {
    id: "g-cormorant",
    title: "Cormorant Point Lake House",
    style: "Lake home",
    region: "Midwest",
    budget: "$850k+",
    sqft: 3610,
    beds: 3,
    baths: 4,
    builder: "Lakeside Custom Homes",
    swatch: ["#1f2a2c", "#8fa183"],
  },
  {
    id: "g-hollowbrook",
    title: "Hollowbrook Craftsman",
    style: "Craftsman",
    region: "Midwest",
    budget: "$350k–$600k",
    sqft: 1980,
    beds: 2,
    baths: 2,
    builder: "Timber & Stone Co.",
    swatch: ["#2c2118", "#b07c4a"],
  },
  {
    id: "g-birchfield",
    title: "Birchfield Modern Ranch",
    style: "Modern ranch",
    region: "Midwest",
    budget: "$350k–$600k",
    sqft: 2460,
    beds: 3,
    baths: 2,
    builder: "Northgate Residential",
    swatch: ["#26221b", "#a89e8c"],
  },
  {
    id: "g-sablewood",
    title: "Sablewood Desert Contemporary",
    style: "Contemporary",
    region: "Southwest",
    budget: "$850k+",
    sqft: 3320,
    beds: 4,
    baths: 4,
    builder: "Sun Mesa Builders",
    swatch: ["#2e2218", "#ecab78"],
  },
  {
    id: "g-fernhollow",
    title: "Fernhollow Coastal Cottage",
    style: "Coastal",
    region: "Northeast",
    budget: "$600k–$850k",
    sqft: 2210,
    beds: 3,
    baths: 3,
    builder: "Tidewater Homes",
    swatch: ["#1c2630", "#7fa6c4"],
  },
  {
    id: "g-cedar-bluff",
    title: "Cedar Bluff Mountain Lodge",
    style: "Mountain lodge",
    region: "Mountain West",
    budget: "$850k+",
    sqft: 3980,
    beds: 5,
    baths: 4,
    builder: "Alpine Crafted",
    swatch: ["#241d16", "#8a5a38"],
  },
  {
    id: "g-marigold",
    title: "Marigold Court Bungalow",
    style: "Craftsman",
    region: "Southeast",
    budget: "$350k–$600k",
    sqft: 1740,
    beds: 3,
    baths: 2,
    builder: "Lowcountry Build Co.",
    swatch: ["#2a221a", "#d6a86c"],
  },
  {
    id: "g-northwind",
    title: "Northwind Prairie Modern",
    style: "Modern farmhouse",
    region: "Midwest",
    budget: "$600k–$850k",
    sqft: 3050,
    beds: 4,
    baths: 3,
    builder: "Hearthstone Builders",
    swatch: ["#2b2519", "#cf9a5e"],
  },
];

export const GALLERY_STYLES: string[] = [
  ...new Set(GALLERY_PROJECTS.map((p) => p.style)),
].sort();

export const GALLERY_REGIONS: string[] = [
  ...new Set(GALLERY_PROJECTS.map((p) => p.region)),
].sort();

export const GALLERY_BUDGETS: string[] = [
  "$350k–$600k",
  "$600k–$850k",
  "$850k+",
];
