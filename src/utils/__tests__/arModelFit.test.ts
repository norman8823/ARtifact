import { fitModel } from "../arModelFit";
import { applyViewerDefaults, type AutoFitOptions } from "../arSceneDefaults";

const limits = { maxHeight: 1.8, maxWidth: 1.5, minHeight: 0.3 };
const upright = { scale: 1, rotation: [0, 0, 0] as [number, number, number] };
/** A box `h` tall whose base sits `base` above its origin, `w` wide. */
const box = (h: number, base = 0, w = 0.5) => ({
  min: [-w / 2, base, -w / 2],
  max: [w / 2, base + h, w / 2],
});

describe("fitModel", () => {
  it("lowers a model whose base floats above its origin onto the floor", () => {
    // Paris: base 1.22 m above the origin, so it stood at podium height.
    const fit = fitModel(box(1.2, 1.22), upright, limits)!;
    expect(fit.positionY).toBeCloseTo(-1.22);
    expect(fit.scale).toBe(1);
  });

  it("lifts a model whose base is below its origin", () => {
    const fit = fitModel(box(1, -0.4), upright, limits)!;
    expect(fit.positionY).toBeCloseTo(0.4);
  });

  it("shrinks a model taller than the height limit, and keeps it grounded", () => {
    const fit = fitModel(box(2.54, 0.42), upright, limits)!;
    expect(fit.height).toBeCloseTo(1.8);
    expect(fit.scale).toBeCloseTo(1.8 / 2.54);
    expect(fit.positionY).toBeCloseTo(-0.42 * (1.8 / 2.54));
  });

  it("shrinks a model wider than the footprint limit", () => {
    // A long, low sphinx: the width cap binds before the height cap.
    const fit = fitModel(box(1.4, 0, 3), upright, limits)!;
    expect(fit.width).toBeCloseTo(1.5);
    expect(fit.height).toBeLessThan(1.4);
  });

  it("grows a small model to the minimum height", () => {
    const fit = fitModel(box(0.19, 0, 0.2), upright, limits)!;
    expect(fit.height).toBeCloseTo(0.3);
  });

  it("never grows a small model past the width limit", () => {
    const fit = fitModel(box(0.1, 0, 1.4), upright, limits)!;
    expect(fit.width).toBeLessThanOrEqual(1.5 + 1e-9);
    expect(fit.height).toBeLessThan(0.3);
  });

  it("leaves a model already within limits at its Studio size", () => {
    const fit = fitModel(box(1, 0, 0.5), { ...upright, scale: 1.3 }, limits)!;
    expect(fit.scale).toBe(1.3);
  });

  it("treats Studio's scale as the preferred size", () => {
    // 0.19 m model at Studio scale 5 = 0.95 m: within limits, kept.
    const fit = fitModel(box(0.19, 0, 0.29), { ...upright, scale: 5 }, limits)!;
    expect(fit.scale).toBe(5);
    expect(fit.height).toBeCloseTo(0.95);
  });

  it("falls back to scale 1 for an invalid Studio scale, as Studio does", () => {
    expect(fitModel(box(1), { ...upright, scale: 0 }, limits)!.scale).toBe(1);
    expect(fitModel(box(1), { ...upright, scale: null }, limits)!.scale).toBe(1);
  });

  it("grounds through Studio's rotation (an upside-down scan)", () => {
    // Base at origin, 2 m up; flipped 180° about X it hangs 2 m below.
    const fit = fitModel(box(1.5, 0), { scale: 1, rotation: [180, 0, 0] }, limits)!;
    expect(fit.positionY).toBeCloseTo(1.5);
    expect(fit.height).toBeCloseTo(1.5);
  });

  it("returns null for degenerate bounds", () => {
    expect(fitModel({ min: [0, 0, 0], max: [0, 0, 0] }, upright, limits)).toBeNull();
  });
});

describe("applyViewerDefaults with auto-fit", () => {
  const asset = {
    id: "paris",
    asset_type_name: "3D-MODEL",
    trigger_image_url: null as string | null,
    tap_to_place: false,
    is_draggable: true,
    position_x: 0,
    position_y: -1.19,
    position_z: 0,
    scale: 1,
    rotation_x: 0,
    rotation_y: 0,
    rotation_z: 0,
  };
  const scene = {
    scene: { plane_detection: "NONE", plane_direction: null },
    assets: [asset],
  };
  const options = (o: Partial<AutoFitOptions> = {}): AutoFitOptions => ({
    enabled: true,
    bounds: { paris: box(2.12, 1.22, 1.54) },
    limits,
    ...o,
  });

  it("replaces Studio's size and height for a measured model, not its rotation", () => {
    // 2.12 m tall and 1.54 m wide: the height cap (1.8 / 2.12) binds first.
    const out = applyViewerDefaults(scene, options()).assets[0];
    expect(out.scale).toBeCloseTo(1.8 / 2.12);
    expect(out.position_y).toBeCloseTo(-1.22 * (1.8 / 2.12));
    expect(out).toMatchObject({ rotation_x: 0, rotation_y: 0, rotation_z: 0 });
  });

  it("is a no-op when switched off: plain Studio values", () => {
    const out = applyViewerDefaults(scene, options({ enabled: false })).assets[0];
    expect(out).toMatchObject({ scale: 1, position_y: -1.19, rotation_y: 0 });
  });

  it("is a no-op for a model missing from the table", () => {
    const out = applyViewerDefaults(scene, options({ bounds: {} })).assets[0];
    expect(out).toMatchObject({ scale: 1, position_y: -1.19, rotation_y: 0 });
  });
});
