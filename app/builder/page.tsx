"use client";

/**
 * Step 0 — "Pick a lot".
 *
 * Address search (Nominatim) → MapLibre map → Overpass nearest building (or a
 * polygon-draw fallback) → parallel USGS / Overpass site-intelligence calls →
 * project creation → advance to the brief step.
 *
 * The whole flow is offline-safe and reload-safe: every network call degrades
 * gracefully, and progress is snapshotted to localStorage.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  PencilRuler,
  Search,
} from "lucide-react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { geocodeAddress } from "@/lib/gis/geocode";
import { nearestBuilding } from "@/lib/gis/overpass";
import {
  polygonBBox,
  polygonCentroid,
  squareAround,
} from "@/lib/gis/geometry";
import {
  clearLotSnapshot,
  loadLotSnapshot,
  localProjectId,
  saveLocalProject,
  saveLotSnapshot,
} from "@/lib/gis/lotStorage";
import type {
  ElevationGrid,
  FeatureCollection,
  GeocodeResult,
  PolygonFeature,
  SiteMeta,
} from "@/lib/gis/types";
import { MapPicker, type MapPickerHandle } from "./MapPicker";

/** Default map centre — the continental US, before a search. */
const DEFAULT_CENTER: [number, number] = [-86.26, 39.95];
const DEFAULT_ZOOM = 4;

type Phase =
  | "search" // typing / picking an address
  | "locating" // querying Overpass for the nearest building
  | "confirm" // a candidate parcel is shown — accept / draw
  | "drawing" // polygon-draw fallback in progress
  | "gathering" // running the three GIS calls
  | "done"; // project created, navigating away

interface GisStep {
  key: "parcel" | "elevation" | "neighbors" | "streets";
  label: string;
  state: "pending" | "active" | "done" | "skipped";
}

const INITIAL_STEPS: GisStep[] = [
  { key: "parcel", label: "Pulling parcel boundaries…", state: "pending" },
  { key: "elevation", label: "Fetching elevation…", state: "pending" },
  { key: "neighbors", label: "Mapping neighbors…", state: "pending" },
  { key: "streets", label: "Tracing streets…", state: "pending" },
];

export default function LotPickerPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const mapRef = useRef<MapPickerHandle>(null);

  const [phase, setPhase] = useState<Phase>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [parcel, setParcel] = useState<PolygonFeature | null>(null);
  const [drawCount, setDrawCount] = useState(0);
  const [steps, setSteps] = useState<GisStep[]>(INITIAL_STEPS);
  const [error, setError] = useState<string | null>(null);

  const [initialCenter, setInitialCenter] =
    useState<[number, number]>(DEFAULT_CENTER);
  const [initialZoom, setInitialZoom] = useState(DEFAULT_ZOOM);
  const [restored, setRestored] = useState(false);

  // --- Reload-safe restore -------------------------------------------------
  useEffect(() => {
    const snap = loadLotSnapshot();
    if (snap?.center) {
      setInitialCenter(snap.center);
      setInitialZoom(snap.zoom ?? 17);
    }
    if (snap?.address) setAddress(snap.address);
    if (snap?.parcel) {
      setParcel(snap.parcel);
      setPhase("confirm");
    }
    setRestored(true);
  }, []);

  // Re-apply a restored parcel to the map once it has mounted.
  useEffect(() => {
    if (restored && parcel) mapRef.current?.setParcel(parcel);
  }, [restored, parcel]);

  // --- Address autocomplete (250ms debounce) ------------------------------
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || phase !== "search") {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      const found = await geocodeAddress(q, controller.signal);
      setResults(found);
      setShowDropdown(true);
      setSearching(false);
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      setSearching(false);
    };
  }, [query, phase]);

  const persistMove = useCallback(
    (center: [number, number], zoom: number) => {
      saveLotSnapshot({ center, zoom });
    },
    [],
  );

  // --- Address selection ---------------------------------------------------
  async function selectAddress(result: GeocodeResult) {
    track("address_selected", { label: result.label });
    setQuery(result.label);
    setAddress(result.label);
    setResults([]);
    setShowDropdown(false);
    setError(null);
    mapRef.current?.flyTo(result.lng, result.lat, 18);
    saveLotSnapshot({
      address: result.label,
      center: [result.lng, result.lat],
      zoom: 18,
    });

    setPhase("locating");
    const building = await nearestBuilding(result.lat, result.lng, 50);
    if (building) {
      setParcel(building);
      mapRef.current?.setParcel(building);
      saveLotSnapshot({ parcel: building });
      setPhase("confirm");
    } else {
      // No footprint nearby — seed a small square and offer draw mode.
      const seed = squareAround(result.lng, result.lat, 30);
      setParcel(seed);
      mapRef.current?.setParcel(seed);
      saveLotSnapshot({ parcel: seed });
      setPhase("confirm");
      setError(
        "No building footprint found nearby — accept the highlighted area or draw your lot.",
      );
    }
  }

  // --- Polygon-draw fallback ----------------------------------------------
  function beginDraw() {
    setError(null);
    setParcel(null);
    mapRef.current?.setParcel(null);
    mapRef.current?.startDraw((n) => setDrawCount(n));
    setDrawCount(0);
    setPhase("drawing");
  }

  function finishDraw() {
    const drawn = mapRef.current?.finishDraw() ?? null;
    if (!drawn) {
      setError("Place at least three corners to outline the lot.");
      return;
    }
    setParcel(drawn);
    mapRef.current?.setParcel(drawn);
    saveLotSnapshot({ parcel: drawn });
    setPhase("confirm");
  }

  function cancelDraw() {
    mapRef.current?.cancelDraw();
    setDrawCount(0);
    setPhase(parcel ? "confirm" : "search");
  }

  // --- Confirm parcel → gather site intelligence --------------------------
  function setStep(key: GisStep["key"], state: GisStep["state"]) {
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, state } : s)),
    );
  }

  async function confirmParcel() {
    if (!parcel) return;
    track("parcel_confirmed", { address: address ?? "" });
    setPhase("gathering");
    setSteps(INITIAL_STEPS.map((s) => ({ ...s })));
    setError(null);

    setStep("parcel", "active");
    const bbox = polygonBBox(parcel);
    setStep("parcel", "done");

    setStep("elevation", "active");
    setStep("neighbors", "active");
    setStep("streets", "active");

    const meta: SiteMeta = {
      address: address ?? undefined,
      center: polygonCentroid(parcel),
      capturedAt: new Date().toISOString(),
    };

    // Three parallel, individually failure-tolerant calls.
    const elevationP = fetch("/api/gis/elevation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bbox }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { elevation?: ElevationGrid | null } | null) => {
        const grid = d?.elevation ?? null;
        if (grid) meta.elevation = grid;
        setStep("elevation", grid ? "done" : "skipped");
      })
      .catch(() => setStep("elevation", "skipped"));

    const neighborsP = fetch("/api/gis/neighbors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bbox }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { neighbors?: FeatureCollection } | null) => {
        const fc = d?.neighbors;
        if (fc && fc.features.length > 0) meta.neighbors = fc;
        setStep("neighbors", fc ? "done" : "skipped");
      })
      .catch(() => setStep("neighbors", "skipped"));

    const streetsP = fetch("/api/gis/streets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bbox }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { streets?: FeatureCollection } | null) => {
        const fc = d?.streets;
        if (fc && fc.features.length > 0) meta.streets = fc;
        setStep("streets", fc ? "done" : "skipped");
      })
      .catch(() => setStep("streets", "skipped"));

    await Promise.allSettled([elevationP, neighborsP, streetsP]);

    await createAndAdvance({
      name: address ?? "Sited project",
      address: address ?? undefined,
      parcel,
      meta,
    });
  }

  // --- Skip — design without a lot ----------------------------------------
  async function skip() {
    track("parcel_skipped");
    setPhase("gathering");
    await createAndAdvance({ name: "Untitled project" });
  }

  /**
   * Create the project (Supabase-backed when possible, localStorage fallback
   * otherwise) and navigate to the brief step. Never blocks on failure.
   */
  async function createAndAdvance(input: {
    name: string;
    address?: string;
    parcel?: PolygonFeature | null;
    meta?: SiteMeta;
  }) {
    let projectId: string | null = null;
    try {
      const res = await fetch("/api/gis/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          address: input.address ?? null,
          parcelGeojson: input.parcel ?? null,
          meta: input.meta ?? null,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          persisted?: boolean;
          projectId?: string;
        };
        if (data.persisted && data.projectId) projectId = data.projectId;
      }
    } catch {
      // Network failure — fall through to the keyless local fallback.
    }

    if (!projectId) {
      // Keyless fallback: a client-generated id persisted to localStorage.
      projectId = localProjectId();
      saveLocalProject(projectId, {
        address: input.address,
        parcel: input.parcel ?? null,
        meta: input.meta,
      });
    }

    saveLotSnapshot({ projectId, local: projectId.startsWith("local-") });
    setPhase("done");
    clearLotSnapshot();
    router.push(`/builder/brief?projectId=${encodeURIComponent(projectId)}`);
  }

  const reveal = reduce
    ? {}
    : ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      } as const);

  const gathering = phase === "gathering" || phase === "done";

  return (
    <BuilderShell current="lot">
      <motion.div {...reveal} className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <MapPin className="size-3.5 text-copper" />
            Step 0 · The lot
          </span>
          <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
            Start with the lot
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Search an address — Atelier pulls the parcel, the terrain, and the
            neighbours from public mapping data so the design is sited from the
            first click.
          </p>
        </div>

        {/* Address search */}
        <div className="relative mt-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-2" />
            {searching && (
              <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-2" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (phase !== "search") setPhase("search");
                if (e.target.value.trim().length >= 3) {
                  track("lot_search_started");
                }
              }}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              disabled={gathering}
              placeholder="Search an address — 123 Cedar Lane, Zionsville, IN"
              aria-label="Lot address"
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30 disabled:opacity-60"
            />
          </div>

          {showDropdown && results.length > 0 && (
            <ul
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-border bg-surface-2 shadow-xl"
              role="listbox"
              aria-label="Address results"
            >
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => selectAddress(r)}
                    className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:bg-surface-3 focus-visible:text-foreground focus-visible:outline-none"
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-copper" />
                    <span className="leading-snug">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map */}
        <div className="relative mt-4 h-[clamp(20rem,52vh,32rem)] overflow-hidden rounded-card border border-border bg-surface">
          <MapPicker
            ref={mapRef}
            initialCenter={initialCenter}
            initialZoom={initialZoom}
            onMove={persistMove}
          />

          {phase === "locating" && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-ink/85 px-4 py-2.5 text-xs text-muted backdrop-blur">
              <Loader2 className="size-3.5 animate-spin text-copper" />
              Looking for the building footprint…
            </div>
          )}

          {phase === "drawing" && (
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-ink/90 px-4 py-2.5 text-xs text-muted backdrop-blur">
              <span className="inline-flex items-center gap-1.5">
                <PencilRuler className="size-3.5 text-copper" />
                Click the lot corners — {drawCount} placed
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => mapRef.current?.undoDraw()}
                  className="rounded-full border border-border px-2.5 py-1 text-foreground transition-colors hover:border-border-bright"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={cancelDraw}
                  className="rounded-full border border-border px-2.5 py-1 text-foreground transition-colors hover:border-border-bright"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={finishDraw}
                  className="rounded-full bg-copper px-2.5 py-1 font-medium text-ink transition-colors hover:bg-copper-bright"
                >
                  Finish lot
                </button>
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-xs text-copper-bright" role="alert">
            {error}
          </p>
        )}

        {/* Confirm panel */}
        {phase === "confirm" && parcel && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-4 rounded-card border border-border bg-surface p-5"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-copper/15 text-copper">
                <MapPin className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-base tracking-tight">
                  Is this your lot?
                </p>
                {address && (
                  <p className="mt-0.5 truncate text-xs text-muted-2">
                    {address}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button onClick={confirmParcel} size="lg" className="sm:flex-1">
                Yes — use this lot <ArrowRight className="size-4" />
              </Button>
              <Button
                onClick={beginDraw}
                variant="subtle"
                size="lg"
                className="sm:flex-1"
              >
                <PencilRuler className="size-4" /> Draw it myself
              </Button>
            </div>
          </motion.div>
        )}

        {/* Gathering site intelligence */}
        {gathering && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-4 rounded-card border border-border bg-surface p-5"
          >
            <p className="font-display text-base tracking-tight">
              Reading the site…
            </p>
            <ul className="mt-3 space-y-2">
              {steps.map((s) => (
                <li
                  key={s.key}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <StepIcon state={s.state} />
                  <span
                    className={cn(
                      "transition-colors",
                      s.state === "done" && "text-sage",
                      s.state === "active" && "text-foreground",
                      s.state === "skipped" && "text-muted-2",
                      s.state === "pending" && "text-muted-2",
                    )}
                  >
                    {s.label}
                    {s.state === "skipped" && " — skipped"}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Skip link */}
        {!gathering && phase !== "drawing" && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={skip}
              className="text-sm text-muted-2 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Skip — design without a lot
            </button>
          </div>
        )}
      </motion.div>
    </BuilderShell>
  );
}

/** Per-step status glyph in the gathering panel. */
function StepIcon({ state }: { state: GisStep["state"] }) {
  if (state === "done") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-sage text-ink">
        <Check className="size-3" />
      </span>
    );
  }
  if (state === "active") {
    return <Loader2 className="size-5 shrink-0 animate-spin text-copper" />;
  }
  if (state === "skipped") {
    return (
      <span className="size-5 shrink-0 rounded-full border border-border-bright" />
    );
  }
  return (
    <span className="size-5 shrink-0 rounded-full border border-border" />
  );
}
