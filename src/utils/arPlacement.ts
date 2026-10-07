/**
 * Pure placement math for the AR viewer (components/ar-scenes/ArtworkARScene).
 * Kept free of Viro imports so it is unit-testable and Simulator-safe.
 */

export type Vec3 = [number, number, number];

/**
 * Pinch limits, as multiples of the Studio-authored scale. Wide enough to go
 * from tabletop to life-size for the catalog's models, narrow enough that a
 * stray pinch cannot shrink a model out of sight or fill the room with it.
 */
export const MIN_USER_SCALE = 0.25;
export const MAX_USER_SCALE = 4;

export function clampUserScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(MAX_USER_SCALE, Math.max(MIN_USER_SCALE, scale));
}

// Below this horizontal camera→model distance (metres) the direction is too
// noisy to trust — the phone is effectively straight above the tap point.
const MIN_HORIZONTAL_DISTANCE = 0.05;

/**
 * Y rotation (degrees) that turns a model's local +Z — its front, in both the
 * glTF convention and Studio's authoring view — toward the camera, about the
 * world up axis only, so the model stays upright.
 *
 * Rotating by θ about Y maps +Z to (sin θ, 0, cos θ), so θ = atan2(dx, dz) for
 * the horizontal model→camera vector. If the camera is almost directly above
 * the model, falls back to facing against the camera's forward vector; if that
 * is vertical too, returns 0 (authored orientation).
 */
export function yawFacingCamera(
  modelPosition: Vec3,
  cameraPosition: Vec3,
  cameraForward: Vec3,
): number {
  const dx = cameraPosition[0] - modelPosition[0];
  const dz = cameraPosition[2] - modelPosition[2];
  if (Math.hypot(dx, dz) >= MIN_HORIZONTAL_DISTANCE) {
    return toDegrees(Math.atan2(dx, dz));
  }

  const fx = -cameraForward[0];
  const fz = -cameraForward[2];
  if (Math.hypot(fx, fz) > 1e-3) {
    return toDegrees(Math.atan2(fx, fz));
  }
  return 0;
}

function toDegrees(radians: number): number {
  // + 0 normalises -0 so callers and tests never see a signed zero.
  return (radians * 180) / Math.PI + 0;
}
