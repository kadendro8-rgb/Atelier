"use client";

/**
 * HardscapeSceneMeshes — R3F renderer for an extruded hardscape scene.
 *
 * Companion to `SceneMeshes` (the home viewport's mesh renderer): it turns the
 * flat geometry data from `buildHardscapeScene` into shadow-casting meshes,
 * one per `HardscapeElement`, each shaded by the PBR preset that matches its
 * `HardscapeMaterial` (broom-finish, stamped concrete, exposed aggregate,
 * pavers, natural stone).
 *
 * TODO(v2): textured albedo/normal/roughness maps per surface — see the note
 * in `lib/three/hardscapeMaterials.ts`.
 */

import { useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import type {
  HardscapeMeshData,
  HardscapeSceneModel,
} from "@/lib/hardscape/scene";
import { hardscapeMaterialPreset } from "@/lib/three/hardscapeMaterials";

/** Build a three.js BufferGeometry from flat hardscape-mesh data. */
function makeGeometry(mesh: HardscapeMeshData): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(mesh.positions), 3),
  );
  geometry.setIndex(mesh.indices);
  // Slabs are box-like; flat per-face normals keep the cap/wall edges crisp.
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function HardscapeSceneMeshes({
  model,
}: {
  model: HardscapeSceneModel;
}) {
  // Geometry is derived from immutable plan data — memoize on the model.
  const geometries = useMemo(
    () => model.meshes.map((m) => makeGeometry(m)),
    [model],
  );

  return (
    <group>
      {model.meshes.map((mesh, i) => {
        const preset = hardscapeMaterialPreset(mesh.material);
        return (
          <mesh
            key={mesh.id}
            geometry={geometries[i]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={preset.color}
              roughness={preset.roughness}
              metalness={preset.metalness}
              envMapIntensity={preset.envMapIntensity}
            />
          </mesh>
        );
      })}
    </group>
  );
}
