/**
 * Site-photo persistence — best-effort, reload-safe storage for a captured
 * site photo, keyed by project id.
 *
 * A site photo can be several megabytes, so it cannot live in `localStorage`
 * (≈5MB total, synchronous, string-only). This helper uses IndexedDB, which is
 * async and comfortably sized for image blobs.
 *
 * House style mirrors `lib/gis/lotStorage.ts` and `lib/db`: every operation is
 * keyless and degrades gracefully. If IndexedDB is unavailable (private mode,
 * old browser, disabled storage), every function resolves without throwing and
 * the caller simply keeps the photo in memory for the session — the flow never
 * breaks.
 */

/** A captured site photo, held for the session and persisted best-effort. */
export interface SitePhoto {
  /** Owning project id (or a provisional id before a project exists). */
  projectId: string;
  /** The image as a data URL — directly usable as an `<img>` src. */
  dataUrl: string;
  /** MIME type, e.g. `image/jpeg`. */
  mimeType: string;
  /** Pixel width, when known. */
  width?: number;
  /** Pixel height, when known. */
  height?: number;
  /** How the photo entered the flow. */
  source: "camera" | "upload";
  /** ISO timestamp of capture. */
  capturedAt: string;
}

const DB_NAME = "atelier-site-photos";
const STORE = "photos";
const DB_VERSION = 1;

/** Open (or create) the IndexedDB database. Resolves null when unavailable. */
function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(null);
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = window.indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      // Some browsers throw synchronously when storage is disabled.
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "projectId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    // If the open is blocked (another tab holds an old version), don't hang.
    request.onblocked = () => resolve(null);
  });
}

/**
 * Persist a site photo, keyed by `photo.projectId`. Best-effort: resolves
 * `true` on success, `false` when storage is unavailable or the write fails.
 * Never throws.
 */
export async function saveSitePhoto(photo: SitePhoto): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    return await new Promise<boolean>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(photo);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    });
  } catch {
    return false;
  } finally {
    db.close();
  }
}

/**
 * Load the site photo for a project, or null when none is stored / storage is
 * unavailable. Never throws.
 */
export async function loadSitePhoto(
  projectId: string,
): Promise<SitePhoto | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    return await new Promise<SitePhoto | null>((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(projectId);
      req.onsuccess = () =>
        resolve((req.result as SitePhoto | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  } finally {
    db.close();
  }
}

/** Delete the stored site photo for a project. Best-effort; never throws. */
export async function deleteSitePhoto(projectId: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(projectId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    /* non-fatal */
  } finally {
    db.close();
  }
}

/**
 * Re-key a stored photo. The lot step captures a photo before a project id
 * exists (using a provisional id); once the real project id is known, move the
 * record so downstream steps can find it. Best-effort; never throws.
 */
export async function rekeySitePhoto(
  fromId: string,
  toId: string,
): Promise<void> {
  if (fromId === toId) return;
  const photo = await loadSitePhoto(fromId);
  if (!photo) return;
  await saveSitePhoto({ ...photo, projectId: toId });
  await deleteSitePhoto(fromId);
}

/* -------------------------------------------------------------------------- */
/* Browser-side image helpers (used by the capture component)                */
/* -------------------------------------------------------------------------- */

/** Largest edge (px) a stored photo is downscaled to before persisting. */
const MAX_EDGE = 1600;
/** JPEG quality used when re-encoding a downscaled photo. */
const JPEG_QUALITY = 0.85;

/**
 * Read a `File`/`Blob` into a downscaled JPEG data URL plus its dimensions.
 *
 * Downscaling keeps IndexedDB writes small and gives a future image-generation
 * provider a sane input size. Falls back to the raw data URL if the canvas
 * pipeline is unavailable (e.g. SSR or a locked-down browser). Never throws.
 */
export async function fileToSitePhotoData(file: Blob): Promise<{
  dataUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
}> {
  const rawDataUrl = await blobToDataUrl(file);
  if (typeof document === "undefined") {
    return { dataUrl: rawDataUrl, mimeType: file.type || "image/jpeg" };
  }
  try {
    const img = await loadImage(rawDataUrl);
    const { width, height } = fitWithin(
      img.naturalWidth,
      img.naturalHeight,
      MAX_EDGE,
    );
    // No downscale needed — keep the original bytes.
    if (width === img.naturalWidth && height === img.naturalHeight) {
      return {
        dataUrl: rawDataUrl,
        mimeType: file.type || "image/jpeg",
        width,
        height,
      };
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        dataUrl: rawDataUrl,
        mimeType: file.type || "image/jpeg",
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    }
    ctx.drawImage(img, 0, 0, width, height);
    return {
      dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
      mimeType: "image/jpeg",
      width,
      height,
    };
  } catch {
    return { dataUrl: rawDataUrl, mimeType: file.type || "image/jpeg" };
  }
}

/** Read a blob as a data URL. */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(blob);
  });
}

/** Decode a data URL into an `HTMLImageElement`. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode the image."));
    img.src = src;
  });
}

/** Scale `(w, h)` down so the longest edge is at most `max`, preserving ratio. */
function fitWithin(
  w: number,
  h: number,
  max: number,
): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const scale = max / Math.max(w, h);
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  };
}
