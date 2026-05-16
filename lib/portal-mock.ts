/**
 * Deterministic mock project data for the client portal.
 *
 * The portal route (`/p/{slug}/{token}`) has no auth and no database in CORE
 * scope, so the project is themed entirely from the route params. Live project
 * data + Stripe Connect pricing is tracked in docs/v2-spec.md (Section 4).
 */

export type PortalRender = {
  id: string;
  label: string;
  caption: string;
};

export type PortalRoom = {
  name: string;
  area: string;
  finish: string;
};

export type PortalDocument = {
  name: string;
  kind: string;
  size: string;
};

export type PortalPlan = {
  level: string;
  area: string;
  rooms: string;
};

export type PortalProject = {
  slug: string;
  token: string;
  builderName: string;
  builderInitials: string;
  projectName: string;
  clientName: string;
  location: string;
  styleLabel: string;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  heroCaption: string;
  designFee: number;
  deposit: number;
  constructionEstimate: number;
  plans: PortalPlan[];
  renders: PortalRender[];
  rooms: PortalRoom[];
  documents: PortalDocument[];
};

const BUILDERS = [
  "Hearthstone Custom Homes",
  "Cedar & Stone Builders",
  "Northcrest Residential",
  "Timberline Homes Co.",
  "Maple Ridge Builders",
];

const STYLES = [
  "Modern Farmhouse",
  "Hill Country Contemporary",
  "Craftsman Revival",
  "Transitional Prairie",
  "Coastal Modern",
];

const TOWNS = [
  "Zionsville, IN",
  "Park City, UT",
  "Bend, OR",
  "Fredericksburg, TX",
  "Asheville, NC",
];

const CLIENTS = [
  "the Harmon family",
  "the Whitfield residence",
  "the Delgado family",
  "the Carraway household",
  "the Bennett family",
];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function initials(value: string): string {
  const words = value.split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "A") + (words[1]?.[0] ?? "");
}

function currency(value: number): string {
  return value.toLocaleString("en-US");
}

/** Build a stable, themed mock project from the route params. */
export function buildPortalProject(slug: string, token: string): PortalProject {
  const seed = hashString(`${slug}:${token}`);

  const builderName = BUILDERS[seed % BUILDERS.length];
  const styleLabel = STYLES[(seed >> 3) % STYLES.length];
  const location = TOWNS[(seed >> 5) % TOWNS.length];
  const clientName = CLIENTS[(seed >> 7) % CLIENTS.length];

  const squareFeet = 2400 + ((seed >> 2) % 18) * 100;
  const bedrooms = 3 + ((seed >> 4) % 3);
  const bathrooms = 2 + ((seed >> 6) % 3);

  // CORE pricing is illustrative. TODO(v2): pull real Stripe Connect amounts.
  const constructionEstimate = 620_000 + ((seed >> 8) % 40) * 12_500;
  const designFee = 8_500 + ((seed >> 9) % 8) * 500;
  const deposit = Math.round((constructionEstimate * 0.05) / 500) * 500;

  const projectName = titleCase(slug) || "Custom Residence";

  return {
    slug,
    token,
    builderName,
    builderInitials: initials(builderName).toUpperCase(),
    projectName,
    clientName,
    location,
    styleLabel,
    squareFeet,
    bedrooms,
    bathrooms,
    heroCaption: `${styleLabel} · ${currency(squareFeet)} sq ft · ${location}`,
    designFee,
    deposit,
    constructionEstimate,
    plans: [
      {
        level: "Main Level",
        area: `${currency(Math.round(squareFeet * 0.62))} sq ft`,
        rooms: "Great room, kitchen, primary suite, office, 3-car garage",
      },
      {
        level: "Upper Level",
        area: `${currency(Math.round(squareFeet * 0.38))} sq ft`,
        rooms: `${bedrooms - 1} bedrooms, ${bathrooms - 1} baths, loft, laundry`,
      },
    ],
    renders: [
      {
        id: "ext-front",
        label: "Front Elevation",
        caption: "Dusk approach from the motor court",
      },
      {
        id: "ext-rear",
        label: "Rear Elevation",
        caption: "Covered porch and outdoor living",
      },
      {
        id: "int-great",
        label: "Great Room",
        caption: "Vaulted ceiling, full-height glazing",
      },
      {
        id: "int-kitchen",
        label: "Kitchen",
        caption: "Working pantry and waterfall island",
      },
      {
        id: "int-primary",
        label: "Primary Suite",
        caption: "Spa bath and private terrace",
      },
      {
        id: "ext-aerial",
        label: "Site Aerial",
        caption: "Home sited to the lot's solar orientation",
      },
    ],
    rooms: [
      { name: "Great Room", area: "420 sq ft", finish: "White oak, plaster" },
      { name: "Kitchen", area: "310 sq ft", finish: "Quartz, custom rift oak" },
      {
        name: "Primary Suite",
        area: "360 sq ft",
        finish: "Wool carpet, marble bath",
      },
      { name: "Office", area: "180 sq ft", finish: "Walnut built-ins" },
      {
        name: "Covered Porch",
        area: "240 sq ft",
        finish: "Ipe decking, cedar ceiling",
      },
    ],
    documents: [
      { name: "Schematic Design Set", kind: "PDF", size: "4.2 MB" },
      { name: "Exterior Materials Board", kind: "PDF", size: "2.8 MB" },
      { name: "Preliminary Budget Estimate", kind: "PDF", size: "640 KB" },
      { name: "Design Services Agreement", kind: "PDF", size: "320 KB" },
    ],
  };
}

export function formatUSD(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}
