/**
 * Shared GIS types for the lot-picker (W2 — Site Intelligence).
 *
 * These describe the data that flows between the lot page, the `app/api/gis/*`
 * route handlers, and the persisted `projects.meta` column. They intentionally
 * use minimal hand-rolled GeoJSON shapes (rather than `@types/geojson`) so the
 * foundation stays dependency-free.
 */

/** A `[longitude, latitude]` pair, GeoJSON coordinate order. */
export type LngLat = [number, number];

/** A bounding box as `[west, south, east, north]`. */
export type BBox = [number, number, number, number];

/** A GeoJSON Polygon geometry (single outer ring, no holes). */
export interface PolygonGeometry {
  type: "Polygon";
  coordinates: LngLat[][];
}

/** A GeoJSON Feature wrapping a polygon (with arbitrary properties). */
export interface PolygonFeature {
  type: "Feature";
  geometry: PolygonGeometry;
  properties: Record<string, string | number | boolean | null>;
}

/** A GeoJSON FeatureCollection of polygons / linestrings. */
export interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

/** A GeoJSON LineString geometry. */
export interface LineStringGeometry {
  type: "LineString";
  coordinates: LngLat[];
}

/** A GeoJSON Feature with either polygon or linestring geometry. */
export interface GeoFeature {
  type: "Feature";
  geometry: PolygonGeometry | LineStringGeometry;
  properties: Record<string, string | number | boolean | null>;
}

/**
 * Elevation grid resampled to a fixed square resolution. `values` is row-major,
 * length `size * size`, in metres. `null` marks a sample with no data.
 */
export interface ElevationGrid {
  size: number;
  bbox: BBox;
  values: (number | null)[];
  /** Min / max of the non-null samples, for quick normalisation. */
  min: number;
  max: number;
}

/**
 * Site-intelligence payload stored under `projects.meta`. Every field is
 * optional — the lot flow degrades gracefully when a GIS call fails.
 */
export interface SiteMeta {
  /** Resolved street address of the parcel. */
  address?: string;
  /** Parcel centroid, as `[lng, lat]`. */
  center?: LngLat;
  /** Neighbouring building footprints within ~200m of the parcel. */
  neighbors?: FeatureCollection;
  /** Streets within ~200m of the parcel. */
  streets?: FeatureCollection;
  /** USGS 3DEP elevation, resampled to 64×64. */
  elevation?: ElevationGrid;
  /** ISO timestamp the site data was captured. */
  capturedAt?: string;
}

/** A geocoding result from Nominatim, trimmed to what the UI needs. */
export interface GeocodeResult {
  /** Stable id (Nominatim `place_id`). */
  id: string;
  /** Human-readable address label. */
  label: string;
  lat: number;
  lng: number;
}
