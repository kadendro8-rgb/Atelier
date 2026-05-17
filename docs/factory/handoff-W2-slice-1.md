# Handoff — W2 Site Intelligence, Slice 1: "Pick a lot" (Step 0)

> W2 shipped this slice as commit `4974717`. The foreman applied three
> integration corrections in `c8ed963` — this doc reflects the **corrected**
> state, which is what landed on `main`.

## What shipped

An offline-safe, reload-safe Step 0 lot picker at `/builder` — address search
→ map → parcel confirm/draw → parallel GIS gather → project creation → advance
to the brief.

### Routes & files

| File | Role |
|---|---|
| `app/builder/page.tsx` | Step 0 — search → map → confirm → gather → advance |
| `app/builder/MapPicker.tsx` | MapLibre GL surface, OSM + Esri satellite, layer toggle |
| `app/api/gis/elevation/route.ts` | USGS 3DEP → 64×64 elevation grid |
| `app/api/gis/neighbors/route.ts` | Overpass building footprints, bbox +200m |
| `app/api/gis/streets/route.ts` | Overpass `highway` ways, bbox +200m |
| `app/api/gis/project/route.ts` | Creates the project via W1 `createProject`; wraps site data under `meta.site` |
| `lib/gis/types.ts` | Shared GIS / GeoJSON / `SiteMeta` types |
| `lib/gis/geocode.ts` | Nominatim forward-geocoding |
| `lib/gis/overpass.ts` | Overpass: nearest building, buildings/streets in bbox |
| `lib/gis/geometry.ts` | bbox, centroid, expand, square-seed helpers |
| `lib/gis/elevation.ts` | USGS 3DEP coarse-sample + bilinear upscale to 64×64 |
| `lib/gis/draw.ts` | Custom MapLibre polygon-draw controller |
| `lib/gis/lotStorage.ts` | Reload-safe localStorage snapshot + keyless project store |
| `lib/analytics.ts` | `track()` no-op shim (PostHog not installed) |
| `supabase/migrations/20260516140000_projects_meta.sql` | Adds `projects.meta` |
| `lib/db/types.ts` *(modified)* | `ProjectMeta = { site?: SiteMeta }`; `meta` on `ProjectRow`/`ProjectInsert` |
| `package.json` *(modified)* | Adds `"typecheck": "tsc --noEmit"` |

## Foreman integration (`c8ed963`)

W2 shipped against the original brief (`/builder/lot`, flat `meta`). Three
corrections were applied on top, intact, as a deliberate integration commit:

1. **Route consolidated** — the lot picker moved `/builder/lot` → `/builder`,
   replacing the old mock; `MapPicker.tsx` moved alongside it. `/builder/lot`
   deleted. `BuilderShell`'s `lot` step already pointed at `/builder`.
2. **Migration → canonical** — `add column meta jsonb not null default
   '{}'::jsonb` plus a `projects_meta_idx` GIN index.
3. **`meta.site` namespacing** — the GIS payload is persisted **nested under
   `meta.site`** (wrapped at `/api/gis/project`), so future workers add sibling
   `meta.*` keys without ever colliding with `site`.

## The canonical `meta.site` shape — read this, W3/W4

`projects.meta` is `{ site?: SiteMeta }`. `SiteMeta` (`lib/gis/types.ts`):

```ts
meta.site = {
  address?:   string;             // resolved street address
  center?:    [lng, lat];
  neighbors?: FeatureCollection;   // OSM building footprints, ~200m
  streets?:   FeatureCollection;   // OSM highways, ~200m
  elevation?: ElevationGrid;       // { size, bbox, values[], min, max } — USGS 3DEP
  capturedAt?: string;             // ISO timestamp
}
```

Every field is optional — the flow degrades gracefully when a GIS call fails.
`elevation` is the richer `ElevationGrid` (carries `bbox`/`min`/`max`), kept
deliberately over a bare `number[][]`.

## Flow

Address search (Nominatim, 250ms debounce) → select flies the map to zoom 18 →
Overpass `way[building](around:50,…)` finds the nearest footprint (or seeds a
30m square + draw prompt) → confirm runs three parallel GIS calls with a
per-line loading panel → project created via `/api/gis/project` →
`router.push("/builder/brief?projectId=…")`. "Skip" creates an empty project.

## `// DECISION:` deviations

- **No third-party draw library** — `lib/gis/draw.ts` is a self-contained,
  fully-typed MapLibre polygon-draw, to avoid dependency-compat risk.
- **Keyless project fallback** — `createProject` needs an `owner_id`; with no
  session, `/api/gis/project` returns `{ persisted: false }` and the client
  falls back to a `localStorage` `local-<uuid>` project id.

## Known limitations / non-blocking issues

- **Keyless fallback stores `meta` flat.** DB-persisted projects nest under
  `meta.site`; the `localStorage` `local-` fallback still stores `SiteMeta`
  flat. A small follow-up should nest it for parity. Downstream `local-`
  reads must account for this until then.
- **Overpass timeouts** on large bboxes — bbox capped at `0.02°`, 12s timeout,
  two mirrors; very large parcels yield empty neighbor/street data.
- **Elevation** — 9×9 coarse USGS sample upscaled to 64×64; a terrain hint.
- **No IP geolocation** for the initial map centre — opens on a US overview.

## Foreman must verify manually

- [ ] Apply `20260516140000_projects_meta.sql` to the live Supabase project.
- [ ] Mobile (375px) — search field, dropdown, map height, button stacks.
- [ ] Lighthouse ≥ 90 on `/builder` (MapLibre adds ~279 kB to this route).
- [ ] Live GIS — Nominatim, Overpass, the three parallel routes on a real address.
- [ ] Keyboard nav and reload-safety.
- [ ] Keyless run with Supabase unconfigured.

## What W3 needs to know

- Read site data from `meta.site.*` (shape above). Never overwrite `site` —
  add your own `meta.<domain>` key.
- The lot routes to `/builder/brief?projectId=…`; a `local-`-prefixed id is a
  client-only (localStorage) project.
- Projects are read/written via W1's typed helpers in `lib/db/`.
