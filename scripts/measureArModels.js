#!/usr/bin/env node
/**
 * Measures every Studio 3D model and writes src/config/arModelBounds.json,
 * which the AR viewer's auto-fit (src/utils/arModelFit.ts) reads to ground
 * each model on the floor and keep it within living-room limits.
 *
 * Usage:  node scripts/measureArModels.js
 *         (needs RV_API_KEY in .env, as the prebuild does)
 *
 * Re-run after adding or replacing a model file in Studio. Until it is
 * re-run, an artwork whose model is missing from the table simply renders
 * with its Studio values; nothing breaks.
 *
 * Only each .glb's JSON chunk is read: glTF requires POSITION accessors to
 * carry min/max, so the bounds come from the header without downloading or
 * decoding the mesh. Bounds are the model's box in its own root frame, after
 * the glTF node transforms and before Studio's scale/rotation/position.
 */
require("dotenv").config();

const PROJECT_ID = "56b4872e-26e5-4a1a-be24-3dc603579d9c"; // app.json rvProjectId
const API = "https://platform.reactvision.xyz/functions/v1";
const OUT = require("path").join(__dirname, "..", "src", "config", "arModelBounds.json");
const HEADER_BYTES = 4 * 1024 * 1024; // the JSON chunk sits at the front

const key = process.env.RV_API_KEY;
if (!key) {
  console.error("RV_API_KEY is not set (expected in .env).");
  process.exit(1);
}

async function api(path) {
  const res = await fetch(`${API}${path}`, { headers: { "x-api-key": key } });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

/** The glTF JSON chunk of a .glb, fetched with a Range request. */
async function readGltfJson(url) {
  let buf = await rangeFetch(url, HEADER_BYTES);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("not a .glb");
  const jsonLen = buf.readUInt32LE(12);
  if (buf.readUInt32LE(16) !== 0x4e4f534a) throw new Error("first chunk is not JSON");
  if (20 + jsonLen > buf.length) buf = await rangeFetch(url, 20 + jsonLen);
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
}

async function rangeFetch(url, bytes) {
  const res = await fetch(url, { headers: { Range: `bytes=0-${bytes - 1}` } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// --- 4x4 column-major matrices, as glTF stores them -------------------------
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}

function fromTRS(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q;
  const xx = x * x, yy = y * y, zz = z * z;
  const xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [
    (1 - 2 * (yy + zz)) * s[0], 2 * (xy + wz) * s[0], 2 * (xz - wy) * s[0], 0,
    2 * (xy - wz) * s[1], (1 - 2 * (xx + zz)) * s[1], 2 * (yz + wx) * s[1], 0,
    2 * (xz + wy) * s[2], 2 * (yz - wx) * s[2], (1 - 2 * (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ];
}

function apply(m, p) {
  return [0, 1, 2].map((r) => m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r]);
}

/** Normalized integer accessors store min/max as raw integers. */
function dequantize(values, accessor) {
  if (!accessor.normalized) return values;
  const div = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[accessor.componentType];
  return div ? values.map((v) => Math.max(v / div, -1)) : values;
}

function modelBounds(gltf) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const scene = gltf.scenes?.[gltf.scene ?? 0];
  const roots = scene?.nodes ?? (gltf.nodes ?? []).map((_, i) => i);

  const visit = (index, parent) => {
    const node = gltf.nodes[index];
    const local = node.matrix ?? fromTRS(node.translation, node.rotation, node.scale);
    const world = multiply(parent, local);
    if (node.mesh !== undefined) {
      for (const prim of gltf.meshes[node.mesh].primitives) {
        const acc = gltf.accessors[prim.attributes.POSITION];
        if (!acc?.min || !acc?.max) continue;
        const lo = dequantize(acc.min, acc);
        const hi = dequantize(acc.max, acc);
        for (const cx of [lo[0], hi[0]])
          for (const cy of [lo[1], hi[1]])
            for (const cz of [lo[2], hi[2]]) {
              const p = apply(world, [cx, cy, cz]);
              for (let i = 0; i < 3; i++) {
                min[i] = Math.min(min[i], p[i]);
                max[i] = Math.max(max[i], p[i]);
              }
            }
      }
    }
    for (const child of node.children ?? []) visit(child, world);
  };
  for (const r of roots) visit(r, IDENTITY);
  if (!min.every(Number.isFinite)) throw new Error("no POSITION bounds found");
  const round = (v) => Math.round(v * 1e5) / 1e5;
  return { min: min.map(round), max: max.map(round) };
}

async function main() {
  const { project } = await api(`/projects/${PROJECT_ID}`);
  const out = {};
  const failures = [];
  for (const { id: sceneId, name } of project.scenes) {
    const scene = await api(`/scenes/${sceneId}`);
    for (const asset of scene.assets ?? []) {
      if (asset.asset_type_name !== "3D-MODEL" || asset.trigger_image_url) continue;
      try {
        const bounds = modelBounds(await readGltfJson(asset.file_url));
        out[asset.id] = { scene: name, file: asset.file_url, ...bounds };
        console.log(`ok   ${name}`);
      } catch (e) {
        failures.push(`${name}: ${e.message}`);
        console.log(`FAIL ${name}: ${e.message}`);
      }
    }
  }
  const sorted = Object.fromEntries(Object.entries(out).sort(([, a], [, b]) => a.scene.localeCompare(b.scene)));
  require("fs").writeFileSync(OUT, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`\nWrote ${Object.keys(sorted).length} models to ${OUT}`);
  if (failures.length) {
    console.log(`${failures.length} failed:\n  ${failures.join("\n  ")}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
