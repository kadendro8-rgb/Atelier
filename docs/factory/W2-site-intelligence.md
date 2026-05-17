# W2 — Site Intelligence Worker

See `docs/factory.md` for factory rules and quality gates.

**Mission:** Build the entry point no competitor has — address → real lot →
real terrain → real neighbors → ready to design.

**Owns:** `app/builder/lot/page.tsx`, `components/MapPicker.tsx`, `lib/gis/`
(geocoding, parcel import, terrain mesh, neighbor fetching), `app/api/gis/*`.

**Done means:**
- A real address resolves to a satellite-centered map with a parcel polygon.
- USGS 3DEP elevation stored as a height map; Overpass neighbors + streets.
- Data persists; reload returns to the same lot.
- Skip link works; mobile works; failure modes covered (rate limits, timeouts,
  parcel not found, offline).

**Initial backlog:**
1. `app/builder/lot/page.tsx` with `MapPicker` centered on the IP-geolocated city.
2. Nominatim autocomplete (250ms debounce).
3. Confirm address → fly to lat/lng, satellite layer.
4. Overpass nearest building → "Is this your lot?" one-click accept.
5. Polygon-draw fallback.
6. On confirm, parallel calls: USGS 3DEP, Overpass neighbors, Overpass streets.
7. Store in the `projects` row, advance to step 1.
