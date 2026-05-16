"use client";

/**
 * MapPicker — the MapLibre GL surface for the lot picker.
 *
 * Renders an OSM raster basemap with an Esri World Imagery satellite layer and
 * a top-right toggle. Exposes an imperative handle so the parent page can fly
 * the map, draw / read the parcel polygon, and drive the polygon-draw fallback
 * without re-rendering the (expensive) map.
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map as MlMap,
  type StyleSpecification,
} from "maplibre-gl";
import { Layers } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { PolygonDraw } from "@/lib/gis/draw";
import type { PolygonFeature } from "@/lib/gis/types";

const PARCEL_SRC = "atelier-parcel";
const PARCEL_FILL = "atelier-parcel-fill";
const PARCEL_LINE = "atelier-parcel-line";

/** Imperative API the lot page drives the map through. */
export interface MapPickerHandle {
  /** Fly the camera to a coordinate. */
  flyTo(lng: number, lat: number, zoom?: number): void;
  /** Draw (or replace) the confirmed parcel polygon in copper. */
  setParcel(feature: PolygonFeature | null): void;
  /** Enter polygon-draw mode; `onCount` reports corners placed. */
  startDraw(onCount: (n: number) => void): void;
  /** Remove the last drawn corner. */
  undoDraw(): void;
  /** Close the drawn ring and return it (null if < 3 corners). */
  finishDraw(): PolygonFeature | null;
  /** Abort an in-progress draw. */
  cancelDraw(): void;
}

/** OSM raster basemap style. */
function osmStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  };
}

const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

interface MapPickerProps {
  /** Initial centre `[lng, lat]`. */
  initialCenter: [number, number];
  /** Initial zoom. */
  initialZoom: number;
  /** Called after the user pans / zooms, for reload-safe persistence. */
  onMove?: (center: [number, number], zoom: number) => void;
}

export const MapPicker = forwardRef<MapPickerHandle, MapPickerProps>(
  function MapPicker({ initialCenter, initialZoom, onMove }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MlMap | null>(null);
    const drawRef = useRef<PolygonDraw | null>(null);
    const [satellite, setSatellite] = useState(false);
    const [ready, setReady] = useState(false);

    // Keep latest onMove without re-creating the map.
    const onMoveRef = useRef(onMove);
    onMoveRef.current = onMove;

    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: osmStyle(),
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({}), "bottom-right");

      map.on("load", () => {
        setReady(true);
        drawRef.current = new PolygonDraw(map, () => {
          /* count surfaced via startDraw callback */
        });
      });
      map.on("moveend", () => {
        const c = map.getCenter();
        onMoveRef.current?.([c.lng, c.lat], map.getZoom());
      });

      return () => {
        map.remove();
        mapRef.current = null;
        drawRef.current = null;
      };
      // Initial camera is intentionally only applied once.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Swap the satellite raster layer in / out.
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const hasSat = Boolean(map.getLayer("satellite"));
      if (satellite && !hasSat) {
        if (!map.getSource("satellite")) {
          map.addSource("satellite", {
            type: "raster",
            tiles: [SATELLITE_TILES],
            tileSize: 256,
            attribution: "Imagery © Esri",
          });
        }
        // Insert beneath the parcel layers so the polygon stays visible.
        const before = map.getLayer(PARCEL_FILL) ? PARCEL_FILL : undefined;
        map.addLayer(
          { id: "satellite", type: "raster", source: "satellite" },
          before,
        );
      } else if (!satellite && hasSat) {
        map.removeLayer("satellite");
      }
    }, [satellite, ready]);

    function ensureParcelLayers(map: MlMap): void {
      if (map.getSource(PARCEL_SRC)) return;
      map.addSource(PARCEL_SRC, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: PARCEL_FILL,
        type: "fill",
        source: PARCEL_SRC,
        paint: { "fill-color": "#d28a55", "fill-opacity": 0.22 },
      });
      map.addLayer({
        id: PARCEL_LINE,
        type: "line",
        source: PARCEL_SRC,
        paint: { "line-color": "#ecab78", "line-width": 2.5 },
      });
    }

    useImperativeHandle(
      ref,
      (): MapPickerHandle => ({
        flyTo(lng, lat, zoom) {
          mapRef.current?.flyTo({
            center: [lng, lat],
            zoom: zoom ?? 18,
            speed: 1.2,
          });
        },
        setParcel(feature) {
          const map = mapRef.current;
          if (!map) return;
          ensureParcelLayers(map);
          const src = map.getSource(PARCEL_SRC) as
            | GeoJSONSource
            | undefined;
          if (src) {
            src.setData(
              feature
                ? { type: "FeatureCollection", features: [feature] }
                : { type: "FeatureCollection", features: [] },
            );
          }
        },
        startDraw(onCount) {
          const map = mapRef.current;
          if (!map) return;
          drawRef.current = new PolygonDraw(map, onCount);
          drawRef.current.start();
        },
        undoDraw() {
          drawRef.current?.undo();
        },
        finishDraw() {
          return drawRef.current?.finish() ?? null;
        },
        cancelDraw() {
          drawRef.current?.cancel();
        },
      }),
      [],
    );

    return (
      <div className="relative size-full">
        <div
          ref={containerRef}
          className="size-full"
          aria-label="Lot location map"
          role="application"
        />
        <button
          type="button"
          onClick={() => setSatellite((s) => !s)}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-ink/85 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur transition-colors hover:border-copper hover:text-copper-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40"
          aria-pressed={satellite}
        >
          <Layers className="size-3.5 text-copper" />
          {satellite ? "Satellite" : "Map"}
        </button>
      </div>
    );
  },
);
