"use client";

import { Suspense, useId, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping, PCFSoftShadowMap } from "three";
import { buildScene } from "@/lib/kernel/scene";
import type { PlanGraph } from "@/lib/kernel/types";
import {
  computeSun,
  formatHour,
  SUN_DAY_END,
  SUN_DAY_START,
} from "@/lib/three/lighting";
import { SceneMeshes } from "./viewport/SceneMeshes";

/**
 * Real-time 3D viewport — step 1 of the hybrid render pipeline.
 *
 * Renders the extruded massing model produced by `buildScene` (floor slab,
 * walls, roof per `graph.roof`) inside a React Three Fiber canvas with PBR
 * materials, image-based lighting from a drei `<Environment>` preset, a
 * parametric time-of-day sun with soft PCF shadows, and an orbit camera.
 * The output is a credible base image for the later AI img2img photo-finish.
 *
 * TODO(v2): CSG opening cuts, real SunCalc geolocation, walk/preset cameras,
 * three-gpu-pathtracer photoreal pass. See spec §2.
 */
export function Viewport3D({ graph }: { graph: PlanGraph }) {
  // `buildScene` is pure over an immutable plan graph — memoize on identity.
  const model = useMemo(() => buildScene(graph), [graph]);

  // Time-of-day, in hours (24h clock). Default to mid-afternoon for a warm,
  // well-lit hero read with long-ish shadows.
  const [hour, setHour] = useState(15);
  const sliderId = useId();

  // Frame the camera relative to the footprint so any plan size fits.
  const span = Math.max(model.size.width, model.size.depth, 1);
  const camDist = span * 1.1 + model.size.height;
  const cameraPosition: [number, number, number] = [
    camDist,
    camDist * 0.75,
    camDist,
  ];

  // Resolve the sun on a parametric arc scaled to the footprint.
  const sun = useMemo(() => computeSun(hour, span * 2.2), [hour, span]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="aspect-video w-full">
        <Canvas
          shadows={{ type: PCFSoftShadowMap }}
          camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 5000 }}
          gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
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

          {/* Image-based lighting from a built-in drei HDRI preset — lazy,
              no custom HDRI file. Suspense covers the async preset fetch. */}
          <Suspense fallback={null}>
            <Environment preset="sunset" environmentIntensity={sun.daylight} />
          </Suspense>

          <SceneMeshes model={model} />

          {/* Ground plane catches the sun's shadow below the slab. */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.25, 0]}
            receiveShadow
          >
            <planeGeometry args={[span * 6, span * 6]} />
            <meshStandardMaterial color="#1a1916" roughness={1} metalness={0} />
          </mesh>

          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            minDistance={span * 0.4}
            maxDistance={span * 5}
            maxPolarAngle={Math.PI / 2 - 0.02}
            target={[0, model.size.height * 0.4, 0]}
          />
        </Canvas>
      </div>

      {/* Time-of-day control — drives the sun arc, intensity, and warmth. */}
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
      </div>
    </div>
  );
}
