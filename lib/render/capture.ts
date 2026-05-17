// Atelier — geometry-accurate render capture.
//
// This module turns a live React Three Fiber scene into a high-quality still
// PNG. It is the "build render" deliverable: a faithful depiction of the
// actual designed model — correct layout, proportions, and materials —
// rendered straight from the 3D geometry.
//
// It is deliberately KEYLESS and provider-free: no AI, no API, no env vars.
// Capture is a synchronous read of pixels the GPU already drew. That is what
// makes it geometry-true — it cannot hallucinate, only depict the model.
//
// The companion AI photoreal path (`lib/imagegen/`) remains a separate seam:
// this module never touches it.

import type { Camera, Scene, WebGLRenderer } from "three";

/** A captured still: a PNG data URL plus the pixel dimensions it was drawn at. */
export type RenderCapture = {
  /** The image as a `data:image/png;base64,...` URL. */
  dataUrl: string;
  /** Pixel width of the captured image. */
  width: number;
  /** Pixel height of the captured image. */
  height: number;
  /** Always `image/png` — lossless, so geometry edges stay crisp. */
  mimeType: "image/png";
};

/** Options for a single capture. */
export type CaptureOptions = {
  /**
   * Target pixel width of the still. Height is derived from the live canvas
   * aspect ratio so the framing is never distorted. Defaults to 1600 — a
   * crisp, shareable resolution that stays well within canvas size limits.
   */
  width?: number;
};

/** Default capture width — a high-quality, shareable still. */
const DEFAULT_WIDTH = 1600;

/**
 * Capture a still PNG from a live three.js renderer.
 *
 * Strategy: render the given `scene`/`camera` once at a higher pixel size into
 * the renderer's own drawing buffer, then read it back via `toDataURL`. The
 * renderer is restored to its previous size afterward so the interactive
 * viewport is visually unaffected.
 *
 * Requirements (the viewport that owns the renderer must satisfy these):
 *  - the `WebGLRenderer` was created with `preserveDrawingBuffer: true`, so
 *    the buffer is still readable after the draw call;
 *  - this runs in the browser, on the same frame the caller triggers it.
 *
 * This never throws for an expected failure — a lost context or a tainted
 * canvas resolves the canvas's own error. Callers should still guard the call.
 */
export function captureStill(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  options: CaptureOptions = {},
): RenderCapture {
  const canvas = renderer.domElement;

  // Derive a non-distorting target size from the live canvas aspect ratio.
  const liveWidth = canvas.width || canvas.clientWidth || DEFAULT_WIDTH;
  const liveHeight =
    canvas.height || canvas.clientHeight || Math.round(DEFAULT_WIDTH * 0.5625);
  const aspect = liveWidth / liveHeight;

  const targetWidth = Math.max(1, Math.round(options.width ?? DEFAULT_WIDTH));
  const targetHeight = Math.max(1, Math.round(targetWidth / aspect));

  // Remember the live size + pixel ratio so the interactive viewport is
  // restored exactly as it was after the capture draw.
  const prevSize = { width: liveWidth, height: liveHeight };
  const prevPixelRatio = renderer.getPixelRatio();

  try {
    // Render at the target resolution with a 1:1 pixel ratio — the target
    // size is already the final pixel count, so no extra DPR scaling.
    renderer.setPixelRatio(1);
    renderer.setSize(targetWidth, targetHeight, false);
    renderer.render(scene, camera);

    const dataUrl = canvas.toDataURL("image/png");
    return {
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      mimeType: "image/png",
    };
  } finally {
    // Restore the live viewport size + pixel ratio and redraw so the
    // interactive canvas is visually untouched by the capture.
    renderer.setPixelRatio(prevPixelRatio);
    renderer.setSize(prevSize.width, prevSize.height, false);
    renderer.render(scene, camera);
  }
}

/**
 * Trigger a browser download of a captured still.
 *
 * Keyless and dependency-free — a transient `<a download>` click. Safe to call
 * only in the browser; a no-op-friendly guard keeps SSR bundles happy.
 */
export function downloadCapture(
  capture: RenderCapture,
  filename = "atelier-render.png",
): void {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = capture.dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
