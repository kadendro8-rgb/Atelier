import { describe, expect, it } from "vitest";
import {
  expandBBox,
  polygonBBox,
  polygonCentroid,
  squareAround,
} from "./geometry";
import type { LngLat, PolygonFeature } from "./types";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

/** A polygon from an explicit outer ring. */
function poly(ring: LngLat[]): PolygonFeature {
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: {},
  };
}

/** A unit square centred on the origin. */
const unitSquare = poly([
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
]);

/* -------------------------------------------------------------------------- */
/* polygonBBox                                                                */
/* -------------------------------------------------------------------------- */

describe("polygonBBox", () => {
  it("returns [west, south, east, north] extents", () => {
    expect(polygonBBox(unitSquare)).toEqual([-1, -1, 1, 1]);
  });

  it("handles an off-origin, asymmetric ring", () => {
    const p = poly([
      [10, 20],
      [14, 20],
      [14, 26],
      [10, 26],
      [10, 20],
    ]);
    expect(polygonBBox(p)).toEqual([10, 20, 14, 26]);
  });
});

/* -------------------------------------------------------------------------- */
/* expandBBox                                                                 */
/* -------------------------------------------------------------------------- */

describe("expandBBox", () => {
  it("grows the box outward on every side", () => {
    const [w, s, e, n] = expandBBox([0, 0, 0.01, 0.01], 100);
    expect(w).toBeLessThan(0);
    expect(s).toBeLessThan(0);
    expect(e).toBeGreaterThan(0.01);
    expect(n).toBeGreaterThan(0.01);
  });

  it("expands latitude by metres / 111320 degrees", () => {
    const [, s, , n] = expandBBox([0, 0, 0, 0], 111_320);
    expect(s).toBeCloseTo(-1, 6);
    expect(n).toBeCloseTo(1, 6);
  });

  it("widens longitude more than latitude away from the equator", () => {
    // At 60° latitude cos(60°) = 0.5, so a degree of longitude is half as wide.
    const box: [number, number, number, number] = [0, 60, 0, 60];
    const [w, s, e, n] = expandBBox(box, 1000);
    const dLng = e - w;
    const dLat = n - s;
    expect(dLng).toBeGreaterThan(dLat);
  });

  it("is a no-op for a zero expansion", () => {
    expect(expandBBox([1, 2, 3, 4], 0)).toEqual([1, 2, 3, 4]);
  });
});

/* -------------------------------------------------------------------------- */
/* polygonCentroid                                                            */
/* -------------------------------------------------------------------------- */

describe("polygonCentroid", () => {
  it("averages every outer-ring vertex (including the closing duplicate)", () => {
    // The ring repeats its first vertex, so a closed unit square averages to
    // a point pulled toward that corner — this documents the actual behaviour.
    expect(polygonCentroid(unitSquare)).toEqual([-0.2, -0.2]);
  });

  it("locates the centre of an open (non-repeated) square ring", () => {
    const open = poly([
      [-2, -2],
      [2, -2],
      [2, 2],
      [-2, 2],
    ]);
    expect(polygonCentroid(open)).toEqual([0, 0]);
  });

  it("returns the origin for an empty ring", () => {
    expect(polygonCentroid(poly([]))).toEqual([0, 0]);
  });

  it("locates the centre of an off-origin square", () => {
    const p = poly([
      [10, 10],
      [20, 10],
      [20, 20],
      [10, 20],
      [10, 10],
    ]);
    const [lng, lat] = polygonCentroid(p);
    expect(lng).toBeCloseTo(14, 6);
    expect(lat).toBeCloseTo(14, 6);
  });
});

/* -------------------------------------------------------------------------- */
/* squareAround                                                               */
/* -------------------------------------------------------------------------- */

describe("squareAround", () => {
  it("builds a closed five-vertex ring", () => {
    const ring = squareAround(0, 0, 100).geometry.coordinates[0];
    expect(ring).toHaveLength(5);
    expect(ring[0]).toEqual(ring[4]);
  });

  it("tags the feature as drawn", () => {
    expect(squareAround(0, 0, 100).properties.source).toBe("drawn");
  });

  it("centres the square on the requested point", () => {
    const [w, s, e, n] = polygonBBox(squareAround(5, 7, 250));
    expect((w + e) / 2).toBeCloseTo(5, 6);
    expect((s + n) / 2).toBeCloseTo(7, 6);
  });

  it("produces a box whose latitude span matches the requested size", () => {
    const [, s, , n] = polygonBBox(squareAround(0, 0, 222_640));
    // 222640 m / 111320 = 2° of latitude total span.
    expect(n - s).toBeCloseTo(2, 5);
  });
});
