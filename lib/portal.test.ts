import { describe, expect, it } from "vitest";
import type { ProfileRow, ProjectRow } from "@/lib/db/types";
import { toPortalProject } from "./portal";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

function room(use: string, label: string, areaSqft: number, finishFloor: string) {
  return {
    id: `room-${label}`,
    label,
    use,
    zone: "public",
    polygon: [],
    areaSqft,
    ceilingMm: 2700,
    finishFloor,
  };
}

const PLAN_GRAPH = {
  schemaVersion: 1,
  seed: 1,
  level: "Main Level",
  bounds: { width: 12000, height: 9000 },
  roof: "gable",
  walls: [],
  openings: [],
  rooms: [
    room("great-room", "Great Room", 420, "White oak"),
    room("kitchen", "Kitchen", 300, "Quartz"),
    room("primary-suite", "Primary Suite", 360, "Wool carpet"),
    room("bedroom", "Bedroom 2", 160, "Carpet"),
    room("bedroom", "Bedroom 3", 150, "Carpet"),
    room("bathroom", "Bath 1", 80, "Tile"),
    room("bathroom", "Bath 2", 70, "Tile"),
  ],
};

function projectRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: "proj-1",
    owner_id: "owner-1",
    client_id: null,
    name: "Cedar Lane Farmhouse",
    slug: "cedar-lane-farmhouse",
    address: "Zionsville, IN",
    parcel_geojson: null,
    brief: { sqft: 2800, beds: 4, baths: 3, style: "modern-farmhouse" },
    plan_graph: PLAN_GRAPH as ProjectRow["plan_graph"],
    meta: null,
    status: "review",
    share_token: "tok-1",
    design_fee_cents: 850_000,
    deposit_cents: 3_100_00,
    construction_estimate_cents: 62_000_000,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function profileRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: "owner-1",
    role: "builder",
    display_name: "Sam Reyes",
    company_name: "Hearthstone Custom Homes",
    phone: null,
    avatar_url: null,
    stripe_customer_id: null,
    stripe_connect_account_id: null,
    plan: "studio",
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/* Mapping real columns                                                       */
/* -------------------------------------------------------------------------- */

describe("toPortalProject — real project fields", () => {
  const p = toPortalProject({
    project: projectRow(),
    owner: profileRow(),
    client: null,
    token: "tok-1",
  });

  it("carries the project identity and share link", () => {
    expect(p.projectName).toBe("Cedar Lane Farmhouse");
    expect(p.slug).toBe("cedar-lane-farmhouse");
    expect(p.token).toBe("tok-1");
    expect(p.location).toBe("Zionsville, IN");
  });

  it("uses the owner's company as the builder identity", () => {
    expect(p.builderName).toBe("Hearthstone Custom Homes");
    expect(p.builderInitials).toBe("HC");
  });

  it("converts the cents pricing columns to whole dollars", () => {
    expect(p.designFee).toBe(8500);
    expect(p.deposit).toBe(3100);
    expect(p.constructionEstimate).toBe(620000);
  });

  it("reads the headline stats from the brief", () => {
    expect(p.squareFeet).toBe(2800);
    expect(p.bedrooms).toBe(4);
    expect(p.bathrooms).toBe(3);
  });

  it("title-cases the style id from the brief", () => {
    expect(p.styleLabel).toBe("Modern Farmhouse");
  });
});

/* -------------------------------------------------------------------------- */
/* Derivation from the plan graph                                             */
/* -------------------------------------------------------------------------- */

describe("toPortalProject — plan-graph derivation", () => {
  it("builds the room spec from the stored plan graph", () => {
    const p = toPortalProject({
      project: projectRow(),
      owner: profileRow(),
      client: null,
      token: "tok-1",
    });
    expect(p.rooms).toHaveLength(7);
    expect(p.rooms[0]).toEqual({
      name: "Great Room",
      area: "420 sq ft",
      finish: "White oak",
    });
  });

  it("derives a floor-plan entry with the level and total area", () => {
    const p = toPortalProject({
      project: projectRow(),
      owner: profileRow(),
      client: null,
      token: "tok-1",
    });
    expect(p.plans).toHaveLength(1);
    expect(p.plans[0].level).toBe("Main Level");
    // 420+300+360+160+150+80+70 = 1540
    expect(p.plans[0].area).toBe("1,540 sq ft");
  });

  it("derives the bed/bath counts from rooms when the brief omits them", () => {
    const p = toPortalProject({
      project: projectRow({ brief: null }),
      owner: profileRow(),
      client: null,
      token: "tok-1",
    });
    // primary-suite + 2 bedrooms = 3 sleeping rooms; 2 bathrooms.
    expect(p.bedrooms).toBe(3);
    expect(p.bathrooms).toBe(2);
    expect(p.squareFeet).toBe(1540);
  });
});

/* -------------------------------------------------------------------------- */
/* Fallbacks                                                                  */
/* -------------------------------------------------------------------------- */

describe("toPortalProject — fallbacks", () => {
  it("falls back to display_name when the owner has no company", () => {
    const p = toPortalProject({
      project: projectRow(),
      owner: profileRow({ company_name: null }),
      client: null,
      token: "tok-1",
    });
    expect(p.builderName).toBe("Sam Reyes");
  });

  it("uses a neutral builder name when there is no owner profile", () => {
    const p = toPortalProject({
      project: projectRow(),
      owner: null,
      client: null,
      token: "tok-1",
    });
    expect(p.builderName).toBe("Atelier Studio");
  });

  it("names the client from their profile, or a neutral default", () => {
    const named = toPortalProject({
      project: projectRow(),
      owner: profileRow(),
      client: profileRow({ display_name: "the Harmon family" }),
      token: "tok-1",
    });
    expect(named.clientName).toBe("the Harmon family");

    const anon = toPortalProject({
      project: projectRow(),
      owner: profileRow(),
      client: null,
      token: "tok-1",
    });
    expect(anon.clientName).toBe("your client");
  });

  it("zeroes pricing when the cents columns are absent", () => {
    const p = toPortalProject({
      project: projectRow({
        design_fee_cents: null,
        deposit_cents: null,
        construction_estimate_cents: null,
      }),
      owner: profileRow(),
      client: null,
      token: "tok-1",
    });
    expect(p.designFee).toBe(0);
    expect(p.deposit).toBe(0);
    expect(p.constructionEstimate).toBe(0);
  });

  it("falls back to placeholder plans and rooms with no plan graph", () => {
    const p = toPortalProject({
      project: projectRow({ plan_graph: null }),
      owner: profileRow(),
      client: null,
      token: "tok-1",
    });
    expect(p.plans.length).toBeGreaterThan(0);
    expect(p.rooms.length).toBeGreaterThan(0);
  });

  it("always populates the renders and documents tabs", () => {
    const p = toPortalProject({
      project: projectRow(),
      owner: profileRow(),
      client: null,
      token: "tok-1",
    });
    expect(p.renders.length).toBeGreaterThan(0);
    expect(p.documents.length).toBeGreaterThan(0);
  });
});
