import { applyViewerDefaults, hasPlaceableModel } from "../arSceneDefaults";

const model = {
  id: "m",
  asset_type_name: "3D-MODEL",
  trigger_image_url: null as string | null,
  tap_to_place: false,
  is_draggable: true,
  position_x: 0,
  position_y: -1.8,
  position_z: 0,
  rotation_y: -43.6,
  scale: 1.1,
};

const scene = (assets: (typeof model)[]) => ({
  scene: { id: "s", plane_detection: "NONE", plane_direction: null },
  assets,
  animations: [{ id: "a" }],
});

describe("applyViewerDefaults", () => {
  it("makes a model tap-to-place and fixed in place, centred on the tap point", () => {
    const out = applyViewerDefaults(
      scene([{ ...model, position_x: 0.7, position_z: -2.1 }]),
    );
    expect(out.assets[0]).toMatchObject({
      tap_to_place: true,
      is_draggable: false,
      position_x: 0,
      position_z: 0,
    });
  });

  it("keeps the Studio height, negative values included", () => {
    expect(applyViewerDefaults(scene([model])).assets[0].position_y).toBe(-1.8);
    expect(
      applyViewerDefaults(scene([{ ...model, position_y: 0.35 }])).assets[0].position_y,
    ).toBe(0.35);
  });

  it("treats a missing Studio height as the floor", () => {
    const out = applyViewerDefaults(
      scene([{ ...model, position_y: null as unknown as number }]),
    );
    expect(out.assets[0].position_y).toBe(0);
  });

  it("turns on horizontal plane detection for the placement tap", () => {
    const out = applyViewerDefaults(scene([model]));
    expect(out.scene.plane_detection).toBe("AUTOMATIC");
    expect(out.scene.plane_direction).toBe("Horizontal");
  });

  it("keeps everything else Studio authored", () => {
    const out = applyViewerDefaults(scene([model]));
    expect(out.assets[0].rotation_y).toBe(-43.6);
    expect(out.assets[0].scale).toBe(1.1);
    expect(out.animations).toEqual([{ id: "a" }]);
    expect(out.scene.id).toBe("s");
  });

  it("does not mutate the fetched scene", () => {
    const input = scene([model]);
    applyViewerDefaults(input);
    expect(input.assets[0].tap_to_place).toBe(false);
    expect(input.scene.plane_detection).toBe("NONE");
  });

  it("leaves image-triggered models and non-model assets alone", () => {
    const marker = { ...model, trigger_image_url: "https://example.com/t.png" };
    const text = { ...model, asset_type_name: "TEXT" };
    const out = applyViewerDefaults(scene([marker, text]));
    expect(out.assets[0]).toEqual(marker);
    expect(out.assets[1]).toEqual(text);
  });
});

describe("hasPlaceableModel", () => {
  it("is false for an empty scene", () => {
    expect(hasPlaceableModel(scene([]))).toBe(false);
  });

  it("is true once the scene has a 3D model", () => {
    expect(hasPlaceableModel(scene([model]))).toBe(true);
  });
});
