/**
 * Viewer defaults applied to every Studio scene before it renders
 * (components/ar-scenes/ARSceneNavigator). Kept free of Viro imports so it is
 * unit-testable and Simulator-safe.
 *
 * Why: the AR viewer has one interaction — tap a surface to place the model,
 * then drag it along the floor — and it must hold for every artwork. In Studio
 * those are three per-scene settings (tap to place, draggable, plane
 * detection), and none of the project's scenes had them set when this was
 * written (audited 2026-11-09: 0 of 57), because the pre-Studio renderer
 * ignored them. Setting them here means a new scene works without anyone
 * remembering to tick them. Everything else still comes from Studio: the model
 * file, its rotation and scale, animations and click actions.
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
      // Studio drags along the detected surface only when plane detection is
      // on; with NONE it drags at a fixed distance from the camera.
      plane_detection: "AUTOMATIC",
      plane_direction: "Horizontal",
    },
    assets: scene.assets.map((asset) =>
      isPlaceableModel(asset)
        ? {
            ...asset,
            tap_to_place: true,
            is_draggable: true,
            // A placed model's authored position is an offset from the tap
            // point. Scenes were authored with offsets that suit Studio's
            // preview (often 1–2 m below the origin) and would sink the model
            // under the floor, so the model sits exactly where the user taps.
            position_x: 0,
            position_y: 0,
            position_z: 0,
          }
        : asset,
    ),
  };
}
