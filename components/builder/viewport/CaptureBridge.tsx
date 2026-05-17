"use client";

/**
 * CaptureBridge — the in-Canvas hook for geometry-accurate render capture.
 *
 * React Three Fiber owns the `WebGLRenderer`, `Scene` and `Camera` inside the
 * `<Canvas>` tree. This component lives *inside* a Canvas, reads those three
 * objects via `useThree`, and writes a `captureStill`-bound closure into a ref
 * the parent (outside the Canvas) holds. The parent can then trigger a
 * high-resolution still capture from a normal button handler.
 *
 * It renders nothing. It is the minimal, typed seam between the imperative
 * three.js capture path (`lib/render/capture.ts`) and the declarative R3F tree.
 */

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { captureStill, type RenderCapture } from "@/lib/render/capture";

/** A parent-held handle: call it to capture the current frame as a PNG. */
export type CaptureHandle = (() => RenderCapture | null) | null;

/** Mutable ref the parent passes in; CaptureBridge fills it with a capture fn. */
export type CaptureHandleRef = { current: CaptureHandle };

export function CaptureBridge({
  handleRef,
}: {
  handleRef: CaptureHandleRef;
}) {
  // `useThree` selectors are stable references for the lifetime of the Canvas.
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    handleRef.current = () => {
      try {
        return captureStill(gl, scene, camera);
      } catch {
        // A lost GL context or a tainted canvas — surface as "no capture"
        // rather than throwing into a button handler.
        return null;
      }
    };
    return () => {
      handleRef.current = null;
    };
  }, [gl, scene, camera, handleRef]);

  return null;
}
