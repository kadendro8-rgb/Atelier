"use client";

import { useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import type { MeshData, SceneModel } from "@/lib/kernel/scene";
import { defaultMaterials, type SurfaceMaterials } from "@/lib/three/materials";

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

/**
 * Renders every mesh in a SceneModel with a physically-based material.
 *
 * Materials default sensibly from `model.graph.roof` (see `defaultMaterials`);
 * a caller may override the set once a material picker exists.
 *
 * TODO(v2): per-surface material picker UI + textured PBR maps.
 */
export function SceneMeshes({
  model,
  materials,
}: {
  model: SceneModel;
  /** Optional explicit material set; defaults from the plan's roof type. */
  materials?: SurfaceMaterials;
}) {
  // Geometries are derived from immutable plan data, so memoize on the model.
  const geometries = useMemo(
    () => model.meshes.map((m) => makeGeometry(m)),
    [model],
  );

  const surfaces = useMemo(
    () => materials ?? defaultMaterials(model.graph.roof),
    [materials, model.graph.roof],
  );

  return (
    <group>
      {model.meshes.map((mesh, i) => {
        const preset = surfaces[mesh.material];
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
