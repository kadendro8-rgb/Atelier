/**
 * Reload-safe persistence for the lot-picker flow.
 *
 * The whole lot step survives a mid-flow page reload by snapshotting its
 * state to `localStorage`. This is independent of Supabase: it works keyless
 * and is also the canonical store for projects created in the keyless
 * fallback path.
 */
import type { PolygonFeature, SiteMeta } from "@/lib/gis/types";

const KEY = "atelier:lot-flow";

/** A persisted snapshot of the lot-picker's progress. */
export interface LotSnapshot {
  /** The address the user confirmed. */
  address?: string;
  /** Map centre `[lng, lat]`. */
  center?: [number, number];
  /** Zoom level. */
  zoom?: number;
  /** The confirmed (or drawn) parcel polygon. */
  parcel?: PolygonFeature | null;
  /** Site-intelligence payload gathered so far. */
  meta?: SiteMeta;
  /** A project id once one has been created. */
  projectId?: string;
  /** Whether the project lives only in localStorage (keyless fallback). */
  local?: boolean;
}

/** Read the persisted lot snapshot, or null when none / unavailable. */
export function loadLotSnapshot(): LotSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LotSnapshot;
  } catch {
    return null;
  }
}

/** Merge a patch into the persisted lot snapshot. Never throws. */
export function saveLotSnapshot(patch: Partial<LotSnapshot>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadLotSnapshot() ?? {};
    window.localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

/** Clear the persisted lot snapshot. */
export function clearLotSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* non-fatal */
  }
}

/**
 * Persist a keyless-fallback project (id + payload) so it survives reload and
 * downstream steps can read it. Mirrors what Supabase would have stored.
 */
export function saveLocalProject(
  projectId: string,
  data: {
    address?: string;
    parcel?: PolygonFeature | null;
    meta?: SiteMeta;
  },
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `atelier:project:${projectId}`,
      JSON.stringify({ id: projectId, ...data }),
    );
  } catch {
    /* non-fatal */
  }
}

/** Generate a stable local-only project id. */
export function localProjectId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `local-${rand}`;
}
