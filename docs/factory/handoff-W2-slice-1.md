# Handoff — W2 Site Intelligence, Slice 1: "Pick a lot" (Step 0)

## What shipped

A complete, offline-safe Step 0 lot picker at the **new** route `/builder/lot`.

### Routes & files (all new, except the two noted)

| File | Role |
|---|---|
| `app/builder/lot/page.tsx` | The Step 0 page — search → map → confirm → gather → advance |
| `app/builder/lot/MapPicker.tsx` | MapLibre GL surface, OSM + Esri satellite, layer toggle |
| `app/api/gis/elevation/route.ts` | USGS 3DEP → 64×64 elevation grid |
| `app/api/gis/neighbors/route.ts` | Overpass building footprints, bbox +200m |
| `app/api/gis/streets/route.ts` | Overpass `highway` ways, bbox +200m |
| `app/api/gis/project/route.ts` | Creates the project via W1 `createProject` |
| `lib/gis/types.ts` | Shared GIS / GeoJSON / `SiteMeta` types |
| `lib/gis/geocode.ts` | Nominatim forward-geocoding |
| `lib/gis/overpass.ts` | Overpass: nearest building, buildings/streets in bbox |
| `lib/gis/geometry.ts` | bbox, centroid, expand, square-seed helpers |
| `lib/gis/elevation.ts` | USGS 3DEP coarse-sample + bilinear upscale to 64×64 |
| `lib/gis/draw.ts` | Custom MapLibre polygon-draw controller |
| `lib/gis/lotStorage.ts` | Reload-safe localStorage snapshot + keyless project store |
| `lib/analytics.ts` | `track()` no-op shim (PostHog not installed) |
| `supabase/migrations/20260516140000_projects_meta.sql` | Adds `projects.meta jsonb` |
| `lib/db/types.ts` *(modified)* | Adds `ProjectMeta`, `meta` on `ProjectRow`/`ProjectInsert` |
| `package.json` *(modified)* | Adds `"typecheck": "tsc --noEmit"` |

### Flow

1. Address search — Nominatim, 250ms debounce, top-5 dropdown.
2. Select → map flies to the lat/lng at zoom 18.
3. Overpass `way[building](around:50,...)` finds the nearest footprint, drawn in
   copper → "Is this your lot?". If none, a 30m square is seeded and the user is
   nudged to draw.
4. "Draw it myself" → custom polygon-draw (click corners, undo, finish).
5. Confirm → three **parallel** GIS calls (elevation / neighbors / streets) with a
   per-line loading panel that ticks green (or "skipped") as each resolves.
6. Project created via `/api/gis/project` → `router.push("/builder/brief?projectId=…")`.
7. "Skip — design without a lot" creates an empty project and advances the same way.

## `// DECISION:` deviations

- **No third-party draw library.** The spec said "install a maplibre-compatible
  draw library". Instead `lib/gis/draw.ts` is a small, fully-typed polygon-draw
  built on MapLibre's native GeoJSON sources + click handlers. Rationale:
  mapbox-gl-draw needs a MapLibre interop shim and terra-draw pulls two packages;
  a self-contained controller guarantees a clean strict-TS build, zero
  dependency-compat risk, and full control over copper styling. `package.json`
  therefore gained only the `typecheck` script, no new dependency.
- **Keyless project fallback.** `createProject` requires an `owner_id` (FK to
  `auth.users`); with no session there is no valid owner. `/api/gis/project`
  returns `{ persisted: false }` for both "no session" and `DbUnavailableError`,
  and the client falls back to a `localStorage`-persisted `local-<uuid>` id.
  Downstream steps must treat a `local-` prefixed `projectId` as client-only.

## Known limitations / non-blocking issues

- **Overpass timeouts on large bboxes.** Mitigated: neighbors/streets routes cap
  the expanded bbox at `0.02°` span and return an empty collection (`capped:true`)
  beyond that; Overpass calls use a 12s timeout and two mirrors. Very large
  parcels will yield empty neighbor/street data — acceptable, the flow proceeds.
- **Elevation cost.** USGS `identify` is one HTTP call per point. We sample a
  9×9 coarse lattice (81 calls) and bilinearly upscale to 64×64; an 18s overall
  budget caps it. Coarser than a true 64×64 sample — fine for a terrain hint.
- **No IP geolocation** for the initial map centre (spec backlog item #1
  mentioned it). Map opens on a US overview; first address search recenters it.
  Reload restores the last centre/zoom from the snapshot.
- **`/builder` and `/builder/lot` overlap.** The existing `/builder/page.tsx` is
  the old mock lot picker and `BuilderShell`'s rail still links `lot → /builder`.
  Both now exist. **Needs reconciliation** (see below) — out of scope for this
  bounded task, which forbade touching `app/builder/page.tsx` and `BuilderShell`.
- The migration file is committed but **not applied to the live Supabase
  project** — that is a foreman task.

## Assumptions

- `maplibre-gl` (already a dependency) is the map engine; its CSS is imported
  locally in `MapPicker.tsx`.
- `projects.meta` is freeform `jsonb`; neighbors/streets/elevation live under it.
- Nominatim/Overpass/USGS/Esri public endpoints are reachable from the browser
  and the Vercel server runtime (no keys required).

## Foreman must verify manually

- [ ] **Apply the migration** `20260516140000_projects_meta.sql` to live Supabase.
- [ ] **Mobile (375px)** — search field, dropdown, map height
      (`clamp(20rem,52vh,32rem)`), confirm + draw button stacks.
- [ ] **Lighthouse ≥ 90** on `/builder/lot` (note: MapLibre adds ~279 kB to this
      route's bundle — expected for an interactive map; isolated to this route).
- [ ] **Live GIS calls** — confirm Nominatim autocomplete, Overpass nearest
      building, and the three parallel routes resolve against a real address.
- [ ] **Keyboard nav** — tab through search → results → map controls → buttons.
- [ ] **Reload-safety** — mid-flow reload restores centre/zoom/parcel.
- [ ] **Keyless run** — with Supabase unconfigured, confirm the flow still
      advances via the `local-` project id.
- [ ] **Reconcile `/builder` vs `/builder/lot`.** Recommended: redirect
      `/builder` → `/builder/lot` (or replace the old page) and update
      `BuilderShell` STEPS so `lot.href` points at `/builder/lot`.
