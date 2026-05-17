/**
 * Mock data for the v2.0 moat pages (Section 7): the review-partner dashboard,
 * contractor match, installer network, and the public design gallery. These
 * routes are presentational — there is no backend yet, so the data lives here
 * as typed fixtures. Real sources are tracked in docs/v2-spec.md section 7.
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
/* Review-partner dashboard                                                   */
/* -------------------------------------------------------------------------- */

export type ReviewStatus = "new" | "in-review" | "ready";

export type ReviewProject = {
  id: string;
  contractor: string;
  project: string;
  location: string;
  sqft: number;
  /** Partner's share of the review fee (80% of total; Atelier keeps 20%). */
  reviewFee: number;
  deadline: string;
  status: ReviewStatus;
};

export const REVIEW_QUEUE: ReviewProject[] = [
  {
    id: "ATL-2041",
    contractor: "Stoneline Hardscapes",
    project: "Maple Ridge Paver Patio",
    location: "Zionsville, IN",
    sqft: 940,
    reviewFee: 1480,
    deadline: "May 21, 2026",
    status: "new",
  },
  {
    id: "ATL-2038",
    contractor: "Bluewater Pools & Patios",
    project: "Cormorant Point Pool Deck",
    location: "Culver, IN",
    sqft: 1610,
    reviewFee: 1820,
    deadline: "May 19, 2026",
    status: "in-review",
  },
  {
    id: "ATL-2035",
    contractor: "Fieldstone Paver Co.",
    project: "Hollowbrook Outdoor Kitchen",
    location: "Carmel, IN",
    sqft: 680,
    reviewFee: 1010,
    deadline: "May 18, 2026",
    status: "ready",
  },
  {
    id: "ATL-2033",
    contractor: "North Ridge Hardscape",
    project: "Birchfield Backyard Retreat",
    location: "Westfield, IN",
    sqft: 1460,
    reviewFee: 1240,
    deadline: "May 24, 2026",
    status: "new",
  },
  {
    id: "ATL-2029",
    contractor: "Stoneline Hardscapes",
    project: "Sycamore Court Fire Terrace",
    location: "Fishers, IN",
    sqft: 1180,
    reviewFee: 1600,
    deadline: "May 27, 2026",
    status: "in-review",
  },
];

/* -------------------------------------------------------------------------- */
/* Contractor match                                                           */
/* -------------------------------------------------------------------------- */

export type MatchedContractor = {
  id: string;
  name: string;
  tagline: string;
  region: string;
  rating: number;
  reviews: number;
  projectsBuilt: number;
  priceBand: string;
  specialties: string[];
};

export const MATCHED_CONTRACTORS: MatchedContractor[] = [
  {
    id: "c-stoneline",
    name: "Stoneline Hardscapes",
    tagline: "Third-generation paver and patio crews with an in-house design studio.",
    region: "Greater Indianapolis",
    rating: 4.9,
    reviews: 132,
    projectsBuilt: 410,
    priceBand: "$$$",
    specialties: ["Paver patios", "Outdoor kitchens", "Fire features"],
  },
  {
    id: "c-bluewater",
    name: "Bluewater Pools & Patios",
    tagline: "Pool-deck and waterscape specialists across northern Indiana.",
    region: "Northern Indiana lakes",
    rating: 4.8,
    reviews: 87,
    projectsBuilt: 220,
    priceBand: "$$$$",
    specialties: ["Pool decks", "Retaining walls", "Outdoor living"],
  },
  {
    id: "c-northridge",
    name: "North Ridge Hardscape",
    tagline: "Fixed-price backyard builds with transparent material allowances.",
    region: "Hamilton County",
    rating: 4.7,
    reviews: 154,
    projectsBuilt: 530,
    priceBand: "$$",
    specialties: ["Paver patios", "First-time backyards", "Fixed-price"],
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
  /** Built outdoor area in square feet. */
  sqft: number;
  /** Distinct outdoor zones in the design (patio, kitchen, fire pit, etc.). */
  zones: number;
  /** Headline material — pavers, natural stone, stamped concrete, etc. */
  material: string;
  contractor: string;
  /** Two-stop gradient used as a stand-in for the project hero render. */
  swatch: [string, string];
};

export const GALLERY_PROJECTS: GalleryProject[] = [
  {
    id: "g-maple-ridge",
    title: "Maple Ridge Paver Patio",
    style: "Paver patio",
    region: "Midwest",
    budget: "$15k–$40k",
    sqft: 940,
    zones: 2,
    material: "Clay pavers",
    contractor: "Stoneline Hardscapes",
    swatch: ["#3a2f22", "#d28a55"],
  },
  {
    id: "g-cormorant",
    title: "Cormorant Point Pool Deck",
    style: "Pool deck",
    region: "Midwest",
    budget: "$80k+",
    sqft: 1610,
    zones: 3,
    material: "Travertine",
    contractor: "Bluewater Pools & Patios",
    swatch: ["#1f2a2c", "#8fa183"],
  },
  {
    id: "g-hollowbrook",
    title: "Hollowbrook Outdoor Kitchen",
    style: "Outdoor kitchen",
    region: "Midwest",
    budget: "$40k–$80k",
    sqft: 680,
    zones: 2,
    material: "Natural stone",
    contractor: "Fieldstone Paver Co.",
    swatch: ["#2c2118", "#b07c4a"],
  },
  {
    id: "g-birchfield",
    title: "Birchfield Backyard Retreat",
    style: "Full backyard",
    region: "Midwest",
    budget: "$40k–$80k",
    sqft: 1460,
    zones: 4,
    material: "Concrete pavers",
    contractor: "North Ridge Hardscape",
    swatch: ["#26221b", "#a89e8c"],
  },
  {
    id: "g-sablewood",
    title: "Sablewood Desert Courtyard",
    style: "Full backyard",
    region: "Southwest",
    budget: "$80k+",
    sqft: 1320,
    zones: 4,
    material: "Flagstone",
    contractor: "Sun Mesa Outdoor Living",
    swatch: ["#2e2218", "#ecab78"],
  },
  {
    id: "g-fernhollow",
    title: "Fernhollow Coastal Terrace",
    style: "Paver patio",
    region: "Northeast",
    budget: "$15k–$40k",
    sqft: 720,
    zones: 2,
    material: "Bluestone",
    contractor: "Tidewater Outdoor Co.",
    swatch: ["#1c2630", "#7fa6c4"],
  },
  {
    id: "g-cedar-bluff",
    title: "Cedar Bluff Fire Terrace",
    style: "Fire feature",
    region: "Mountain West",
    budget: "$40k–$80k",
    sqft: 980,
    zones: 3,
    material: "Natural stone",
    contractor: "Alpine Hardscape Crafted",
    swatch: ["#241d16", "#8a5a38"],
  },
  {
    id: "g-marigold",
    title: "Marigold Court Garden Patio",
    style: "Paver patio",
    region: "Southeast",
    budget: "$15k–$40k",
    sqft: 540,
    zones: 1,
    material: "Clay pavers",
    contractor: "Lowcountry Hardscape Co.",
    swatch: ["#2a221a", "#d6a86c"],
  },
  {
    id: "g-northwind",
    title: "Northwind Prairie Pool Deck",
    style: "Pool deck",
    region: "Midwest",
    budget: "$80k+",
    sqft: 1750,
    zones: 3,
    material: "Stamped concrete",
    contractor: "Stoneline Hardscapes",
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
  "$15k–$40k",
  "$40k–$80k",
  "$80k+",
];
