/**
 * USGS 3DEP elevation sampling.
 *
 * Builds a square elevation grid for a bounding box by sampling the USGS
 * `3DEPElevation` ImageServer's `identify` endpoint. The grid is fixed at
 * 64×64 — a balance between fidelity and the number of HTTP calls. Failures
 * resolve to null so the lot flow degrades gracefully.
 */
import type { BBox, ElevationGrid } from "@/lib/gis/types";

const IDENTIFY =
  "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify";

/** Grid resolution requested by the spec. */
const GRID_SIZE = 64;

/**
 * Sampling the grid one point at a time would be 4096 HTTP calls. Instead we
 * sample a coarse lattice and bilinearly upscale to 64×64. `COARSE` controls
 * the lattice density (COARSE×COARSE real samples).
 */
const COARSE = 9;

interface IdentifyResponse {
  value?: string;
}

/** Sample a single elevation point (metres) from USGS 3DEP, or null. */
async function samplePoint(
  lng: number,
  lat: number,
  signal: AbortSignal,
): Promise<number | null> {
  const url =
    `${IDENTIFY}?f=json&geometryType=esriGeometryPoint` +
    `&geometry=${encodeURIComponent(JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }))}` +
    `&returnGeometry=false`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as IdentifyResponse;
    const v = data.value === undefined ? NaN : Number.parseFloat(data.value);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** Bilinearly interpolate a coarse lattice value at fractional indices. */
function bilinear(
  coarse: (number | null)[],
  fx: number,
  fy: number,
): number | null {
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, COARSE - 1);
  const y1 = Math.min(y0 + 1, COARSE - 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const v00 = coarse[y0 * COARSE + x0];
  const v10 = coarse[y0 * COARSE + x1];
  const v01 = coarse[y1 * COARSE + x0];
  const v11 = coarse[y1 * COARSE + x1];
  if (v00 === null || v10 === null || v01 === null || v11 === null) {
    // Fall back to the nearest defined corner.
    return v00 ?? v10 ?? v01 ?? v11 ?? null;
  }
  const top = v00 * (1 - tx) + v10 * tx;
  const bot = v01 * (1 - tx) + v11 * tx;
  return top * (1 - ty) + bot * ty;
}

/**
 * Build a 64×64 elevation grid for a bounding box.
 *
 * @param bbox      `[west, south, east, north]`.
 * @param timeoutMs Overall budget for all sampling requests.
 * @returns An {@link ElevationGrid}, or null if too few samples succeeded.
 */
export async function elevationGrid(
  bbox: BBox,
  timeoutMs = 18_000,
): Promise<ElevationGrid | null> {
  const [w, s, e, n] = bbox;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Sample the coarse lattice in parallel.
  const tasks: Promise<number | null>[] = [];
  for (let iy = 0; iy < COARSE; iy++) {
    for (let ix = 0; ix < COARSE; ix++) {
      const lng = w + ((e - w) * ix) / (COARSE - 1);
      const lat = s + ((n - s) * iy) / (COARSE - 1);
      tasks.push(samplePoint(lng, lat, controller.signal));
    }
  }

  let coarse: (number | null)[];
  try {
    coarse = await Promise.all(tasks);
  } catch {
    coarse = [];
  } finally {
    clearTimeout(timer);
  }

  const defined = coarse.filter((v): v is number => v !== null);
  // Require at least a quarter of the lattice — otherwise treat as a failure.
  if (defined.length < (COARSE * COARSE) / 4) return null;

  // Upscale to GRID_SIZE × GRID_SIZE.
  const values: (number | null)[] = new Array(GRID_SIZE * GRID_SIZE);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const fx = (x / (GRID_SIZE - 1)) * (COARSE - 1);
      const fy = (y / (GRID_SIZE - 1)) * (COARSE - 1);
      values[y * GRID_SIZE + x] = bilinear(coarse, fx, fy);
    }
  }

  return {
    size: GRID_SIZE,
    bbox,
    values,
    min: Math.min(...defined),
    max: Math.max(...defined),
  };
}
