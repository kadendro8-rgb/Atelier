import type { MeshData, SceneModel } from "@/lib/kernel/scene";

/**
 * Export a built 3D scene as a binary glTF (`.glb`).
 *
 * The scene from `buildScene` is plain geometry — flat position/index arrays
 * per mesh, in meters — so this is a small, dependency-free glTF 2.0 writer
 * rather than a three.js `GLTFExporter` pass. Each kernel mesh becomes one
 * glTF mesh/primitive with a PBR material keyed off its `wall|floor|roof`
 * tag. The result opens in any glTF viewer (Blender, three.js, macOS Quick
 * Look). See docs/v2-spec.md §3.3.
 */

/** PBR base colors for the kernel's three material tags. */
const MATERIAL_COLORS: Record<
  MeshData["material"],
  [number, number, number, number]
> = {
  wall: [0.87, 0.85, 0.82, 1],
  floor: [0.52, 0.49, 0.45, 1],
  roof: [0.34, 0.29, 0.26, 1],
};

/** Material order — the index into this list is the glTF material index. */
const MATERIAL_ORDER: MeshData["material"][] = ["wall", "floor", "roof"];

// glTF accessor componentType constants.
const COMPONENT_FLOAT = 5126;
const COMPONENT_UNSIGNED_INT = 5125;
// glTF bufferView target constants.
const TARGET_ARRAY_BUFFER = 34962;
const TARGET_ELEMENT_ARRAY_BUFFER = 34963;

/** Pad a byte array up to a 4-byte boundary with `fill`. */
function padTo4(bytes: Uint8Array, fill: number): Uint8Array {
  const remainder = bytes.byteLength % 4;
  if (remainder === 0) return bytes;
  const padded = new Uint8Array(bytes.byteLength + (4 - remainder));
  padded.set(bytes);
  padded.fill(fill, bytes.byteLength);
  return padded;
}

/** Concatenate byte chunks into one contiguous array. */
function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export function exportGLB(scene: SceneModel): Blob {
  const bufferViews: object[] = [];
  const accessors: object[] = [];
  const meshes: object[] = [];
  const nodes: object[] = [];
  const binChunks: Uint8Array[] = [];
  let byteOffset = 0;

  // A primitive needs at least one triangle; skip degenerate meshes.
  const usable = scene.meshes.filter(
    (m) => m.positions.length >= 9 && m.indices.length >= 3,
  );

  for (const mesh of usable) {
    // --- Positions (VEC3 float) ------------------------------------------
    const positions = Float32Array.from(mesh.positions);
    const posBytes = new Uint8Array(positions.buffer);
    const posView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: posBytes.byteLength,
      target: TARGET_ARRAY_BUFFER,
    });
    binChunks.push(posBytes);
    byteOffset += posBytes.byteLength;

    // glTF requires min/max on a POSITION accessor (viewers use it to frame).
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        const v = positions[i + axis];
        if (v < min[axis]) min[axis] = v;
        if (v > max[axis]) max[axis] = v;
      }
    }
    const posAccessor = accessors.length;
    accessors.push({
      bufferView: posView,
      componentType: COMPONENT_FLOAT,
      count: positions.length / 3,
      type: "VEC3",
      min,
      max,
    });

    // --- Indices (scalar uint32) -----------------------------------------
    const indices = Uint32Array.from(mesh.indices);
    const idxBytes = new Uint8Array(indices.buffer);
    const idxView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: idxBytes.byteLength,
      target: TARGET_ELEMENT_ARRAY_BUFFER,
    });
    binChunks.push(idxBytes);
    byteOffset += idxBytes.byteLength;

    const idxAccessor = accessors.length;
    accessors.push({
      bufferView: idxView,
      componentType: COMPONENT_UNSIGNED_INT,
      count: indices.length,
      type: "SCALAR",
    });

    const meshIndex = meshes.length;
    meshes.push({
      name: mesh.id,
      primitives: [
        {
          attributes: { POSITION: posAccessor },
          indices: idxAccessor,
          material: MATERIAL_ORDER.indexOf(mesh.material),
        },
      ],
    });
    nodes.push({ mesh: meshIndex, name: mesh.id });
  }

  const gltf = {
    asset: { version: "2.0", generator: "Atelier GLB exporter" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials: MATERIAL_ORDER.map((id) => ({
      name: id,
      pbrMetallicRoughness: {
        baseColorFactor: MATERIAL_COLORS[id],
        metallicFactor: 0,
        roughnessFactor: 0.85,
      },
    })),
    accessors,
    bufferViews,
    buffers: byteOffset > 0 ? [{ byteLength: byteOffset }] : [],
  };

  // --- Assemble the GLB container ----------------------------------------
  const jsonBytes = padTo4(new TextEncoder().encode(JSON.stringify(gltf)), 0x20);
  const binBytes =
    byteOffset > 0 ? padTo4(concat(binChunks), 0x00) : new Uint8Array(0);
  const hasBin = binBytes.byteLength > 0;

  const totalLength =
    12 + 8 + jsonBytes.byteLength + (hasBin ? 8 + binBytes.byteLength : 0);
  const out = new Uint8Array(totalLength);
  const view = new DataView(out.buffer);
  let p = 0;

  // 12-byte header: magic "glTF", version 2, total length.
  view.setUint32(p, 0x46546c67, true);
  view.setUint32((p += 4), 2, true);
  view.setUint32((p += 4), totalLength, true);
  p += 4;

  // JSON chunk.
  view.setUint32(p, jsonBytes.byteLength, true);
  view.setUint32((p += 4), 0x4e4f534a, true); // "JSON"
  p += 4;
  out.set(jsonBytes, p);
  p += jsonBytes.byteLength;

  // BIN chunk (omitted when the scene carries no geometry).
  if (hasBin) {
    view.setUint32(p, binBytes.byteLength, true);
    view.setUint32((p += 4), 0x004e4942, true); // "BIN\0"
    p += 4;
    out.set(binBytes, p);
  }

  return new Blob([out], { type: "model/gltf-binary" });
}
