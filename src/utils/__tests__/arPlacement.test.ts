import {
  clampUserScale,
  MAX_USER_SCALE,
  MIN_USER_SCALE,
  yawFacingCamera,
} from "../arPlacement";

// Rotating local +Z by `yawDeg` about Y — what the renderer does to the model.
function frontAfterYaw(yawDeg: number): [number, number] {
  const r = (yawDeg * Math.PI) / 180;
  return [Math.sin(r), Math.cos(r)];
}

describe("yawFacingCamera", () => {
  const forward: [number, number, number] = [0, 0, -1];

  it("leaves the model unrotated when the camera is straight ahead on +Z", () => {
    expect(yawFacingCamera([0, 0, -2], [0, 1.5, 0], forward)).toBeCloseTo(0);
  });

  it("turns the model 180° when the camera is behind it on -Z", () => {
    expect(Math.abs(yawFacingCamera([0, 0, 0], [0, 1.5, -2], forward))).toBeCloseTo(180);
  });

  it("points the model's front at the camera from an arbitrary angle", () => {
    const model: [number, number, number] = [1, 0, -1];
    const camera: [number, number, number] = [-0.5, 1.4, 0.7];
    const [fx, fz] = frontAfterYaw(yawFacingCamera(model, camera, forward));
    const dx = camera[0] - model[0];
    const dz = camera[2] - model[2];
    const len = Math.hypot(dx, dz);
    expect(fx).toBeCloseTo(dx / len);
    expect(fz).toBeCloseTo(dz / len);
  });

  it("ignores camera height (stays upright)", () => {
    const low = yawFacingCamera([0, 0, 0], [1, 0.2, 1], forward);
    const high = yawFacingCamera([0, 0, 0], [1, 3, 1], forward);
    expect(low).toBeCloseTo(high);
    expect(low).toBeCloseTo(45);
  });

  it("falls back to the camera's forward vector when directly overhead", () => {
    // Looking down and slightly toward +X: model should face back toward -X.
    const yaw = yawFacingCamera([0, 0, 0], [0, 1.5, 0], [0.3, -0.95, 0]);
    expect(yaw).toBeCloseTo(-90);
  });

  it("returns 0 when both the offset and forward vector are vertical", () => {
    expect(yawFacingCamera([0, 0, 0], [0, 1.5, 0], [0, -1, 0])).toBe(0);
  });
});

describe("clampUserScale", () => {
  it("passes values within limits through", () => {
    expect(clampUserScale(1.7)).toBe(1.7);
  });

  it("clamps to the min and max", () => {
    expect(clampUserScale(0.01)).toBe(MIN_USER_SCALE);
    expect(clampUserScale(50)).toBe(MAX_USER_SCALE);
  });

  it("resets non-finite input to 1", () => {
    expect(clampUserScale(NaN)).toBe(1);
    expect(clampUserScale(Infinity)).toBe(1);
  });
});
