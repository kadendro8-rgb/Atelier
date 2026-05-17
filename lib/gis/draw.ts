/**
 * Lightweight polygon-draw controller for MapLibre GL.
 *
 * DECISION: rather than add a third-party draw library (mapbox-gl-draw needs
 * a MapLibre interop shim; terra-draw pulls two packages), the parcel-draw
 * fallback is implemented directly on MapLibre's native GeoJSON sources and
 * click handlers. This keeps the dependency surface zero, guarantees a clean
 * strict-TypeScript build, and gives full control over the copper styling.
 *
 * Usage: construct with the map and an `onChange` callback, call `start()` to
 * enter draw mode, click to add corners, then `finish()` to close the ring.
 */
import type {
  GeoJSONSource,
  Map as MlMap,
  MapMouseEvent,
} from "maplibre-gl";
import type { LngLat, PolygonFeature } from "@/lib/gis/types";

const SRC_VERTICES = "atelier-draw-vertices";
const SRC_LINE = "atelier-draw-line";
const LAYER_LINE = "atelier-draw-line-layer";
const LAYER_VERTICES = "atelier-draw-vertices-layer";

/** A polygon-draw session bound to a single MapLibre map instance. */
export class PolygonDraw {
  private readonly map: MlMap;
  private readonly onChange: (count: number) => void;
  private points: LngLat[] = [];
  private active = false;
  private readonly clickHandler: (e: MapMouseEvent) => void;

  /**
   * @param map      The MapLibre map to draw on (must be loaded).
   * @param onChange Called with the current corner count after every click.
   */
  constructor(map: MlMap, onChange: (count: number) => void) {
    this.map = map;
    this.onChange = onChange;
    this.clickHandler = (e: MapMouseEvent) => this.addPoint(e);
  }

  /** Whether a draw session is currently active. */
  get isActive(): boolean {
    return this.active;
  }

  /** Number of corners placed so far. */
  get count(): number {
    return this.points.length;
  }

  private ensureLayers(): void {
    if (!this.map.getSource(SRC_LINE)) {
      this.map.addSource(SRC_LINE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      this.map.addLayer({
        id: LAYER_LINE,
        type: "line",
        source: SRC_LINE,
        paint: {
          "line-color": "#d28a55",
          "line-width": 2,
          "line-dasharray": [2, 1.5],
        },
      });
    }
    if (!this.map.getSource(SRC_VERTICES)) {
      this.map.addSource(SRC_VERTICES, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      this.map.addLayer({
        id: LAYER_VERTICES,
        type: "circle",
        source: SRC_VERTICES,
        paint: {
          "circle-radius": 5,
          "circle-color": "#ecab78",
          "circle-stroke-color": "#0b0a09",
          "circle-stroke-width": 2,
        },
      });
    }
  }

  private render(closed: boolean): void {
    const lineCoords = closed
      ? [...this.points, this.points[0]]
      : this.points;
    const lineSrc = this.map.getSource(SRC_LINE) as
      | GeoJSONSource
      | undefined;
    if (lineSrc) {
      lineSrc.setData({
        type: "FeatureCollection",
        features:
          lineCoords.length > 1
            ? [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: lineCoords,
                  },
                },
              ]
            : [],
      });
    }
    const vertSrc = this.map.getSource(SRC_VERTICES) as
      | GeoJSONSource
      | undefined;
    if (vertSrc) {
      vertSrc.setData({
        type: "FeatureCollection",
        features: this.points.map((p) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: p },
        })),
      });
    }
  }

  private addPoint(e: MapMouseEvent): void {
    if (!this.active) return;
    this.points.push([e.lngLat.lng, e.lngLat.lat]);
    this.render(false);
    this.onChange(this.points.length);
  }

  /** Enter draw mode: the next clicks place polygon corners. */
  start(): void {
    if (this.active) return;
    this.active = true;
    this.points = [];
    this.ensureLayers();
    this.render(false);
    this.map.getCanvas().style.cursor = "crosshair";
    this.map.on("click", this.clickHandler);
    this.onChange(0);
  }

  /** Remove the last placed corner. */
  undo(): void {
    if (this.points.length === 0) return;
    this.points.pop();
    this.render(false);
    this.onChange(this.points.length);
  }

  /**
   * Close the ring and return the drawn polygon, or null when fewer than
   * three corners were placed. Leaves draw mode.
   */
  finish(): PolygonFeature | null {
    this.active = false;
    this.map.off("click", this.clickHandler);
    this.map.getCanvas().style.cursor = "";
    if (this.points.length < 3) {
      this.clearLayers();
      return null;
    }
    this.render(true);
    const ring: LngLat[] = [...this.points, this.points[0]];
    return {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ring] },
      properties: { source: "drawn" },
    };
  }

  /** Abort the session and clear all draw layers. */
  cancel(): void {
    this.active = false;
    this.map.off("click", this.clickHandler);
    this.map.getCanvas().style.cursor = "";
    this.points = [];
    this.clearLayers();
    this.onChange(0);
  }

  private clearLayers(): void {
    for (const id of [LAYER_LINE, LAYER_VERTICES]) {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    }
    for (const id of [SRC_LINE, SRC_VERTICES]) {
      if (this.map.getSource(id)) this.map.removeSource(id);
    }
  }
}
