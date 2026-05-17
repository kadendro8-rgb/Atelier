"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { buildScene } from "@/lib/kernel/scene";
import type { PlanGraph } from "@/lib/kernel/types";
import { SceneMeshes } from "./viewport/SceneMeshes";

/**
 * Real-time 3D viewport.
 *
 * Renders the extruded massing model produced by `buildScene` — floor slab,
 * walls, and a roof per `graph.roof` — inside a React Three Fiber canvas with
 * an orbit camera, ambient + directional lighting, and PBR-ish materials.
 *
 * TODO(v2): CSG opening cuts, HDRI environment, SunCalc sun + time slider,
 * walk/preset cameras, three-gpu-pathtracer photoreal pass. See spec §2.
 */
export function Viewport3D({ graph }: { graph: PlanGraph }) {
  // `buildScene` is pure over an immutable plan graph — memoize on identity.
  const model = useMemo(() => buildScene(graph), [graph]);

  // Frame the camera relative to the footprint so any plan size fits.
  const span = Math.max(model.size.width, model.size.depth, 1);
  const camDist = span * 1.1 + model.size.height;
  const cameraPosition: [number, number, number] = [
    camDist,
    camDist * 0.75,
    camDist,
  ];

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface">
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 5000 }}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
      >
        {/* Ambient fill + a key directional light that casts soft shadows. */}
        <ambientLight intensity={0.6} />
        <hemisphereLight
          color="#f4f0e8"
          groundColor="#0b0a09"
          intensity={0.5}
        />
        <directionalLight
          position={[span, span * 1.5, span * 0.6]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-span}
          shadow-camera-right={span}
          shadow-camera-top={span}
          shadow-camera-bottom={-span}
          shadow-camera-near={0.1}
          shadow-camera-far={span * 6}
        />

        <SceneMeshes model={model} />

        {/* Ground plane catches shadows below the slab. */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.25, 0]}
          receiveShadow
        >
          <planeGeometry args={[span * 6, span * 6]} />
          <meshStandardMaterial color="#141414" roughness={1} metalness={0} />
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
  );
}
