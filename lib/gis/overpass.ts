/**
 * Overpass API helpers — building footprints and street geometry from OSM.
 *
 * Used both from the browser (nearest-building lookup) and from the
 * `app/api/gis/*` route handlers (neighbours, streets). All functions are
 * failure-tolerant: a timeout or HTTP error yields an empty result rather
 * than throwing, so the lot flow can always proceed.
 */
import type {
  BBox,
  FeatureCollection,
  GeoFeature,
  LngLat,
  PolygonFeature,
} from "@/lib/gis/types";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/** Hard cap so a slow Overpass query can never hang a request. */
const TIMEOUT_MS = 12_000;

interface OverpassNode {
  lat: number;
  lon: number;
}
interface OverpassElement {
  type: string;
  id: number;
  geometry?: OverpassNode[];
  tags?: Record<string, string>;
}
interface OverpassResponse {
  elements?: OverpassElement[];
}

/**
 * Run a raw Overpass QL query, trying mirrors in turn.
 * @returns The parsed response, or null on total failure.
 */
async function runOverpass(query: string): Promise<OverpassResponse | null> {
  for (const endpoint of ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      return (await res.json()) as OverpassResponse;
    } catch {
      clearTimeout(timer);
      // Try the next mirror.
    }
  }
  return null;
}

/** Close an OSM way's node list into a GeoJSON polygon ring. */
function ringFromGeometry(geometry: OverpassNode[]): LngLat[] {
  const ring: LngLat[] = geometry.map((n) => [n.lon, n.lat]);
  if (ring.length > 0) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
  }
  return ring;
}

/** Approximate planar area of a polygon ring, in squared degrees. */
function ringArea(ring: LngLat[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum) / 2;
}

/** Centroid of a polygon ring as `[lng, lat]`. */
function ringCentroid(ring: LngLat[]): LngLat {
  let lng = 0;
  let lat = 0;
  const n = ring.length - 1;
  for (let i = 0; i < n; i++) {
    lng += ring[i][0];
    lat += ring[i][1];
  }
  return [lng / n, lat / n];
}

/**
 * Find the building footprint nearest a point, within `radius` metres.
 *
 * @param lat    Latitude of the search point.
 * @param lng    Longitude of the search point.
 * @param radius Search radius in metres (default 50).
 * @returns The closest building as a GeoJSON polygon feature, or null.
 */
export async function nearestBuilding(
  lat: number,
  lng: number,
  radius = 50,
): Promise<PolygonFeature | null> {
  const query = `[out:json][timeout:10];way[building](around:${radius},${lat},${lng});out geom;`;
  const data = await runOverpass(query);
  const ways = (data?.elements ?? []).filter(
    (e) => e.type === "way" && Array.isArray(e.geometry) && e.geometry.length > 2,
  );
  if (ways.length === 0) return null;

  let best: { ring: LngLat[]; dist: number } | null = null;
  for (const way of ways) {
    const ring = ringFromGeometry(way.geometry as OverpassNode[]);
    const [cLng, cLat] = ringCentroid(ring);
    const dist = (cLng - lng) ** 2 + (cLat - lat) ** 2;
    if (!best || dist < best.dist) best = { ring, dist };
  }
  if (!best) return null;

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [best.ring] },
    properties: { source: "osm-building" },
  };
}

/**
 * Fetch all building footprints inside a bounding box.
 *
 * @param bbox `[west, south, east, north]`.
 * @returns A FeatureCollection of building polygons (possibly empty).
 */
export async function buildingsInBBox(
  bbox: BBox,
): Promise<FeatureCollection> {
  const [w, s, e, n] = bbox;
  const query = `[out:json][timeout:25];way[building](${s},${w},${n},${e});out geom;`;
  const data = await runOverpass(query);
  const features: GeoFeature[] = [];
  for (const el of data?.elements ?? []) {
    if (el.type !== "way" || !el.geometry || el.geometry.length < 3) continue;
    const ring = ringFromGeometry(el.geometry);
    if (ringArea(ring) === 0) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ring] },
      properties: { osmId: el.id },
    });
  }
  return { type: "FeatureCollection", features };
}

/**
 * Fetch all streets (OSM `highway` ways) inside a bounding box.
 *
 * @param bbox `[west, south, east, north]`.
 * @returns A FeatureCollection of LineString features (possibly empty).
 */
export async function streetsInBBox(bbox: BBox): Promise<FeatureCollection> {
  const [w, s, e, n] = bbox;
  const query = `[out:json][timeout:25];way[highway](${s},${w},${n},${e});out geom;`;
  const data = await runOverpass(query);
  const features: GeoFeature[] = [];
  for (const el of data?.elements ?? []) {
    if (el.type !== "way" || !el.geometry || el.geometry.length < 2) continue;
    const coords: LngLat[] = el.geometry.map((p) => [p.lon, p.lat]);
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords },
      properties: {
        name: el.tags?.name ?? "",
        highway: el.tags?.highway ?? "",
      },
    });
  }
  return { type: "FeatureCollection", features };
}
