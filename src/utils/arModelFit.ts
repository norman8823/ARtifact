/**
 * Auto-fit for placed AR models: the pure maths behind src/config/arFit.ts.
 * Kept free of Viro imports so it is unit-testable and Simulator-safe.
 *
 * Inputs are a model's box in its own root frame (measured from the .glb by
 * scripts/measureArModels.js into src/config/arModelBounds.json), Studio's
 * scale and rotation, and an optional facing correction picked per artwork
 * (src/config/arModelFacing.json). The output is the scale, rotation and
 * height to render with, such that the model:
 *
 *  - stands with its lowest point exactly on the tapped floor,
 *  - is no taller than maxHeight, no side of its footprint longer than
 *    maxWidth, and no shorter than minHeight,
 *  - has its front toward the viewer.
 *
 * The rotation maths mirrors ViroReact's own (placementStore.js: R = Rz·Ry·Rx,
 * Euler degrees), because that is what renders the result. The placement
 * itself then adds a yaw-only turn toward the camera, which changes neither
 * heights nor footprint diameter, so it can be ignored here. That turn maps
 * the model's +Z axis toward the viewer, which is glTF's "front" convention.
 */
import type { ARFitLimits } from "@/src/config/arFit";

export type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

export interface ModelBounds {
  min: number[];
  max: number[];
}

export interface FitInput {
  /** Studio scale (uniform). Invalid values fall back to 1, as Studio does. */
  scale: number | null | undefined;
  /** Studio rotation, Euler degrees. */
  rotation: [number | null | undefined, number | null | undefined, number | null | undefined];
}

export interface FitResult {
  scale: number;
  rotation: Vec3;
  /** Height offset from the tap point that puts the model's base on the floor. */
  positionY: number;
  /** Final size, for logging and tests. */
  height: number;
  width: number;
}

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** R = Rz·Ry·Rx from Euler degrees — ViroReact's eulerToMat. */
export function eulerToMat([x, y, z]: Vec3): Mat3 {
  const cx = Math.cos(x * RAD), sx = Math.sin(x * RAD);
  const cy = Math.cos(y * RAD), sy = Math.sin(y * RAD);
  const cz = Math.cos(z * RAD), sz = Math.sin(z * RAD);
  return [
    [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
    [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
    [-sy, cy * sx, cy * cx],
  ];
}

/** Inverse of eulerToMat — ViroReact's matToEuler, gimbal-lock case included. */
export function matToEuler(m: Mat3): Vec3 {
  const cy = Math.hypot(m[0][0], m[1][0]);
  const y = Math.atan2(-m[2][0], cy);
  let x: number;
  let z: number;
  if (cy > 1e-6) {
    x = Math.atan2(m[2][1], m[2][2]);
    z = Math.atan2(m[1][0], m[0][0]);
  } else {
    x = 0;
    z = Math.atan2(-m[0][1], m[1][1]);
  }
  return [x * DEG, y * DEG, z * DEG];
}

function multiply(a: Mat3, b: Mat3): Mat3 {
  const out = [0, 1, 2].map((r) =>
    [0, 1, 2].map((c) => a[r][0] * b[0][c] + a[r][1] * b[1][c] + a[r][2] * b[2][c]),
  );
  return out as Mat3;
}

function applyMat(m: Mat3, p: Vec3): Vec3 {
  return [
    m[0][0] * p[0] + m[0][1] * p[1] + m[0][2] * p[2],
    m[1][0] * p[0] + m[1][1] * p[1] + m[1][2] * p[2],
    m[2][0] * p[0] + m[2][1] * p[1] + m[2][2] * p[2],
  ];
}

const finiteOr = (v: number | null | undefined, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

export function fitModel(
  bounds: ModelBounds,
  input: FitInput,
  limits: ARFitLimits,
  /** Extra yaw (degrees) that turns this model's front toward the viewer. */
  facingYaw = 0,
): FitResult | null {
  const studioScale = finiteOr(input.scale, 1) > 0 ? finiteOr(input.scale, 1) : 1;
  const studioRotation: Vec3 = [
    finiteOr(input.rotation[0], 0),
    finiteOr(input.rotation[1], 0),
    finiteOr(input.rotation[2], 0),
  ];
  // Facing is a turn about the vertical axis applied after Studio's rotation,
  // so Studio's tilt fixes (an upside-down scan, say) are kept.
  const rotationMat =
    facingYaw !== 0
      ? multiply(eulerToMat([0, facingYaw, 0]), eulerToMat(studioRotation))
      : eulerToMat(studioRotation);
  // With no tilt the turn is a plain addition, which keeps the triple readable
  // ([0, 120, 0] rather than the equivalent [180, 60, 180]).
  const untilted = Math.abs(studioRotation[0]) < 1e-6 && Math.abs(studioRotation[2]) < 1e-6;
  const rotation: Vec3 =
    facingYaw === 0
      ? studioRotation
      : untilted
        ? [0, studioRotation[1] + facingYaw, 0]
        : matToEuler(rotationMat);

  // Footprint is measured on Studio's rotation only, before the facing turn,
  // as the longest side of the box — what a tape measure would give. The
  // placement's own yaw toward the camera turns the model in place and does
  // not change it.
  const authoredMat = eulerToMat(studioRotation);
  let minY = Infinity;
  let maxY = -Infinity;
  const lo = [Infinity, Infinity];
  const hi = [-Infinity, -Infinity];
  for (const x of [bounds.min[0], bounds.max[0]])
    for (const y of [bounds.min[1], bounds.max[1]])
      for (const z of [bounds.min[2], bounds.max[2]]) {
        const corner: Vec3 = [x * studioScale, y * studioScale, z * studioScale];
        const p = applyMat(rotationMat, corner);
        minY = Math.min(minY, p[1]);
        maxY = Math.max(maxY, p[1]);
        const a = applyMat(authoredMat, corner);
        lo[0] = Math.min(lo[0], a[0]);
        hi[0] = Math.max(hi[0], a[0]);
        lo[1] = Math.min(lo[1], a[2]);
        hi[1] = Math.max(hi[1], a[2]);
      }
  const height = maxY - minY;
  const width = Math.max(hi[0] - lo[0], hi[1] - lo[1]);
  if (![minY, height, width].every(Number.isFinite) || height <= 0 || width <= 0) return null;

  // Shrink to the tighter of the two caps; grow a small model to the minimum
  // height, but never past either cap.
  const cap = Math.min(limits.maxHeight / height, limits.maxWidth / width);
  const factor = height < limits.minHeight ? Math.min(limits.minHeight / height, cap) : Math.min(1, cap);

  return {
    scale: studioScale * factor,
    rotation,
    positionY: -minY * factor,
    height: height * factor,
    width: width * factor,
  };
}
