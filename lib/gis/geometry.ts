/**
 * Small, dependency-free geometry helpers for the lot picker.
 */
import type { BBox, LngLat, PolygonFeature } from "@/lib/gis/types";

/** Mean metres-per-degree of latitude (roughly constant). */
const M_PER_DEG_LAT = 111_320;

/**
 * Axis-aligned bounding box of a polygon feature.
 * @returns `[west, south, east, north]`.
 */
export function polygonBBox(feature: PolygonFeature): BBox {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const ring of feature.geometry.coordinates) {
    for (const [lng, lat] of ring) {
      if (lng < w) w = lng;
      if (lng > e) e = lng;
      if (lat < s) s = lat;
      if (lat > n) n = lat;
    }
  }
  return [w, s, e, n];
}

/**
 * Expand a bounding box outward by `metres` on every side.
 * Longitude expansion is corrected for latitude.
 */
export function expandBBox(bbox: BBox, metres: number): BBox {
  const [w, s, e, n] = bbox;
  const dLat = metres / M_PER_DEG_LAT;
  const midLat = (s + n) / 2;
  const dLng = metres / (M_PER_DEG_LAT * Math.cos((midLat * Math.PI) / 180));
  return [w - dLng, s - dLat, e + dLng, n + dLat];
}

/** Centroid (average of outer-ring vertices) of a polygon feature. */
export function polygonCentroid(feature: PolygonFeature): LngLat {
  const ring = feature.geometry.coordinates[0] ?? [];
  if (ring.length === 0) return [0, 0];
  let lng = 0;
  let lat = 0;
  const n = ring.length;
  for (const [x, y] of ring) {
    lng += x;
    lat += y;
  }
  return [lng / n, lat / n];
}

/** A square polygon feature centred on a point — used as the draw seed. */
export function squareAround(
  lng: number,
  lat: number,
  metres: number,
): PolygonFeature {
  const dLat = metres / 2 / M_PER_DEG_LAT;
  const dLng =
    metres / 2 / (M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  const ring: LngLat[] = [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ];
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: { source: "drawn" },
  };
}
