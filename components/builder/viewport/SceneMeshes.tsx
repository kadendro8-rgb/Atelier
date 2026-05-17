"use client";

import { useMemo } from "react";
import { BufferAttribute, BufferGeometry, type Material } from "three";
import type { MeshData, SceneModel } from "@/lib/kernel/scene";

/**
 * PBR-ish material presets per surface type. Colors come from the locked
 * Atelier identity tokens (see docs/v2-spec.md "Visual identity").
 *
 * TODO(v2): replace with the 30-preset material editor + assets/materials.json.
 */
const MATERIAL_PRESETS: Record<
  MeshData["material"],
  { color: string; roughness: number; metalness: number }
> = {
  wall: { color: "#e8e3d8", roughness: 0.85, metalness: 0.0 },
  floor: { color: "#8a857c", roughness: 0.7, metalness: 0.05 },
  roof: { color: "#3a3633", roughness: 0.6, metalness: 0.1 },
};

/** Build a three.js BufferGeometry from flat scene-mesh data. */
function makeGeometry(mesh: MeshData): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(mesh.positions), 3),
  );
  geometry.setIndex(mesh.indices);
  // Smooth-ish normals; massing reads fine without per-face splitting.
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Renders every mesh in a SceneModel with its preset PBR material. */
export function SceneMeshes({ model }: { model: SceneModel }) {
  // Geometries are derived from immutable plan data, so memoize on the model.
  const geometries = useMemo(
    () => model.meshes.map((m) => makeGeometry(m)),
    [model],
  );

  return (
    <group>
      {model.meshes.map((mesh, i) => {
        const preset = MATERIAL_PRESETS[mesh.material];
        return (
          <mesh
            key={mesh.id}
            geometry={geometries[i]}
            castShadow
            receiveShadow
            // Dispose the generated geometry when the mesh unmounts.
            onUpdate={(self) => {
              const mat = self.material as Material;
              mat.needsUpdate = true;
            }}
          >
            <meshStandardMaterial
              color={preset.color}
              roughness={preset.roughness}
              metalness={preset.metalness}
            />
          </mesh>
        );
      })}
    </group>
  );
}
