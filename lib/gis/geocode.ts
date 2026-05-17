/**
 * Nominatim (OpenStreetMap) forward-geocoding.
 *
 * Keyless, rate-limited public endpoint — used from the browser for the
 * address autocomplete. Failures resolve to an empty list so the UI never
 * blocks on a network error.
 */
import type { GeocodeResult } from "@/lib/gis/types";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

interface NominatimRow {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Geocode a free-text address to up to five candidate results.
 *
 * @param query  The address text (must be non-trivial — caller debounces).
 * @param signal Optional AbortSignal to cancel a stale in-flight request.
 * @returns Up to five results; an empty array on any failure.
 */
export async function geocodeAddress(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = `${NOMINATIM}?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(
    trimmed,
  )}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as NominatimRow[];
    if (!Array.isArray(rows)) return [];
    return rows
      .slice(0, 5)
      .map((r) => ({
        id: String(r.place_id),
        label: r.display_name,
        lat: Number.parseFloat(r.lat),
        lng: Number.parseFloat(r.lon),
      }))
      .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
  } catch {
    // AbortError (stale request) or network failure — both yield no results.
    return [];
  }
}
