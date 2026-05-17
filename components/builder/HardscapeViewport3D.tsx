"use client";

/**
 * HardscapeViewport3D — real-time 3D viewport for a `HardscapePlan`.
 *
 * The hardscape counterpart to `Viewport3D` (the home floor-plan viewport).
 * It renders the extruded site model produced by `buildHardscapeScene` — one
 * slab per surface, each at a realistic per-kind thickness, on a ground plane
 * — inside a React Three Fiber canvas with PBR materials, image-based lighting
 * from a drei `<Environment>` preset, a parametric time-of-day sun with soft
 * shadows, and an orbit camera.
 *
 * Geometry is true to scale: the kernel works in millimeters and
 * `buildHardscapeScene` converts 1:1 to meters, so a 20-foot patio reads as a
 * 20-foot patio.
 *
 * The renderer is created with `preserveDrawingBuffer: true` so the optional
 * `onCapture` callback can pull a geometry-accurate still straight off the
 * drawing buffer — the keyless "build render" (see `lib/render/capture.ts`).
 */

import { Suspense, useId, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping, PCFSoftShadowMap } from "three";
import { Camera } from "lucide-react";
import { buildHardscapeScene } from "@/lib/hardscape/scene";
import type { HardscapePlan } from "@/lib/hardscape/types";
import {
  computeSun,
  formatHour,
  SUN_DAY_END,
  SUN_DAY_START,
} from "@/lib/three/lighting";
import type { RenderCapture } from "@/lib/render/capture";
import { HardscapeSceneMeshes } from "./viewport/HardscapeSceneMeshes";
import {
  CaptureBridge,
  type CaptureHandleRef,
} from "./viewport/CaptureBridge";

export function HardscapeViewport3D({
  plan,
  onCapture,
}: {
  plan: HardscapePlan;
  /**
   * When set, a "Capture render" control appears; clicking it draws a
   * high-resolution still off the live scene and hands the PNG back here.
   */
  onCapture?: (capture: RenderCapture) => void;
}) {
  // `buildHardscapeScene` is pure over an immutable plan — memoize on identity.
  const model = useMemo(() => buildHardscapeScene(plan), [plan]);

  // Time-of-day, in hours (24h clock). Default to mid-afternoon for a warm,
  // well-lit read with long-ish shadows across the slabs.
  const [hour, setHour] = useState(15);
  const [capturing, setCapturing] = useState(false);
  const sliderId = useId();

  // The in-Canvas CaptureBridge fills this ref with a capture closure.
  const captureRef = useRef<CaptureHandleRef["current"]>(null);

  // Frame the camera relative to the site footprint so any plan size fits.
  const span = Math.max(model.size.width, model.size.depth, 1);
  const camDist = span * 1.05 + model.size.height;
  const cameraPosition: [number, number, number] = [
    camDist,
    camDist * 0.62,
    camDist,
  ];

  // Resolve the sun on a parametric arc scaled to the footprint.
  const sun = useMemo(() => computeSun(hour, span * 2.2), [hour, span]);

  function handleCapture() {
    if (!onCapture || capturing) return;
    const capture = captureRef.current?.();
    if (capture) {
      setCapturing(true);
      onCapture(capture);
      // Brief affordance — the parent surfaces the result.
      window.setTimeout(() => setCapturing(false), 600);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="aspect-video w-full">
        <Canvas
          shadows={{ type: PCFSoftShadowMap }}
          camera={{ position: cameraPosition, fov: 42, near: 0.1, far: 5000 }}
          gl={{
            antialias: true,
            toneMapping: ACESFilmicToneMapping,
            // Keep the drawn frame readable so a still can be captured.
            preserveDrawingBuffer: true,
          }}
        >
          {/* Ambient + hemisphere fill, both tracking the daylight level. */}
          <ambientLight intensity={sun.ambientIntensity} />
          <hemisphereLight
            color="#f4f0e8"
            groundColor="#0b0a09"
            intensity={sun.hemiIntensity}
          />

          {/* Parametric sun: a key directional light on a time-of-day arc. */}
          <directionalLight
            position={sun.position}
            intensity={sun.intensity}
            color={sun.color}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0005}
            shadow-camera-left={-span}
            shadow-camera-right={span}
            shadow-camera-top={span}
            shadow-camera-bottom={-span}
            shadow-camera-near={0.1}
            shadow-camera-far={span * 8}
          />

          {/* Image-based lighting from a built-in drei HDRI preset — lazy, no
              custom HDRI file. Suspense covers the async preset fetch. */}
          <Suspense fallback={null}>
            <Environment preset="park" environmentIntensity={sun.daylight} />
          </Suspense>

          <HardscapeSceneMeshes model={model} />

          {/* Ground plane — turf-toned, catches the slabs' shadows. */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.001, 0]}
            receiveShadow
          >
            <planeGeometry args={[span * 8, span * 8]} />
            <meshStandardMaterial
              color="#3c4733"
              roughness={1}
              metalness={0}
            />
          </mesh>

          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            minDistance={span * 0.35}
            maxDistance={span * 5}
            maxPolarAngle={Math.PI / 2 - 0.04}
            target={[0, 0, 0]}
          />

          {/* Imperative seam for geometry-accurate still capture. */}
          <CaptureBridge handleRef={captureRef} />
        </Canvas>
      </div>

      {/* Control strip — time-of-day, and an optional render-capture action. */}
      <div className="flex items-center gap-3 border-t border-border bg-ink-2 px-4 py-2.5">
        <label
          htmlFor={sliderId}
          className="text-[10px] uppercase tracking-wide text-muted-2"
        >
          Time of day
        </label>
        <input
          id={sliderId}
          type="range"
          min={SUN_DAY_START}
          max={SUN_DAY_END}
          step={0.25}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          aria-label="Time of day"
          aria-valuetext={formatHour(hour)}
          className="h-1.5 flex-1 cursor-pointer accent-copper"
        />
        <span className="w-16 text-right font-mono text-xs text-foreground">
          {formatHour(hour)}
        </span>

        {onCapture && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={capturing}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border-bright bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-60"
          >
            <Camera className="size-3.5 text-copper" />
            {capturing ? "Captured" : "Capture render"}
          </button>
        )}
      </div>
    </div>
  );
}
