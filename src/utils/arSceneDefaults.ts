/**
 * Viewer defaults applied to every Studio scene before it renders
 * (components/ar-scenes/ARSceneNavigator). Kept free of Viro imports so it is
 * unit-testable and Simulator-safe.
 *
 * The AR viewer has one interaction: tap the floor and the artwork stands
 * there, at its real size, facing you. It cannot be dragged, pinched or
 * rotated afterwards — a decision made on device 2026-11-26, because a
 * life-size piece that stays put is closer to standing in the museum than one
 * you can shrink and slide around, and because ViroKit 3.x's drag was far
 * too sensitive on a phone held at a low angle.
 *
 * That has to hold for every artwork, so it is forced here rather than left to
 * three per-scene Studio settings (tap to place, draggable, plane detection)
 * that no scene had set when this was written (audited 2026-11-09: 0 of 57).
 * Everything else still comes from Studio, and is how each artwork is tuned
 * without an app release: the model file, its size (scale), facing
 * (rotation) and height, plus animations and click actions.
 */

interface SceneAssetLike {
  asset_type_name: string | null;
  trigger_image_url: string | null;
  tap_to_place?: boolean | null;
  is_draggable: boolean;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
}

interface SceneLike<A extends SceneAssetLike> {
  scene: { plane_detection: string | null; plane_direction: string | null };
  assets: A[];
}

function isPlaceableModel(asset: SceneAssetLike): boolean {
  // An image-triggered model is anchored to its marker; leave it alone.
  return asset.asset_type_name === "3D-MODEL" && !asset.trigger_image_url;
}

export function hasPlaceableModel<A extends SceneAssetLike>(
  scene: SceneLike<A>,
): boolean {
  return scene.assets.some(isPlaceableModel);
}

/** Returns a copy of `scene` with the viewer defaults applied. */
export function applyViewerDefaults<A extends SceneAssetLike, S extends SceneLike<A>>(
  scene: S,
): S {
  return {
    ...scene,
    scene: {
      ...scene.scene,
      // Horizontal plane detection gives the placement tap a real floor to
      // land on rather than a feature-point guess.
      plane_detection: "AUTOMATIC",
      plane_direction: "Horizontal",
    },
    assets: scene.assets.map((asset) =>
      isPlaceableModel(asset)
        ? {
            ...asset,
            tap_to_place: true,
            is_draggable: false,
            // A placed model's authored position is an offset from the tap
            // point, resolved in the frame the user was facing. Horizontal
            // offsets are dropped so the model lands where the user taps.
            //
            // Height is kept, negative values included: it is the per-artwork
            // control for a model whose file origin is not at its base (one
            // that floats above the floor needs a negative Y, one that sinks
            // needs a positive one). Set it for how the model looks in the app,
            // not in Studio's preview, which measures from eye level — several
            // scenes still carry preview values of −1 to −1.8 m (and one of
            // +4 m) that put the model under the floor or out of frame here.
            position_x: 0,
            position_y: asset.position_y ?? 0,
            position_z: 0,
          }
        : asset,
    ),
  };
}
