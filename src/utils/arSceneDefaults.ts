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
 *
 * With AR_AUTO_FIT on (src/config/arFit.ts) a measured model's size and
 * height are then adjusted on top of Studio's — see src/utils/arModelFit.ts.
 * Facing stays Studio's alone.
 * Studio's scale becomes the preferred size within the living-room limits, and
 * Studio's height is replaced by the offset that puts the base on the floor,
 * plus a lift: a positive Studio height raises the base that far above the
 * floor, up to `maxLift` (Head of a King floats at chest level this way). Zero or negative
 * means "on the floor" — the negative values several scenes still carry were
 * hand-made attempts to lower a model to the floor, which grounding now does.
 */
import { AR_AUTO_FIT, AR_FIT_LIMITS, type ARFitLimits } from "@/src/config/arFit";
import measuredBounds from "@/src/config/arModelBounds.json";
import { fitModel, type ModelBounds } from "@/src/utils/arModelFit";

interface SceneAssetLike {
  id?: string;
  asset_type_name: string | null;
  trigger_image_url: string | null;
  tap_to_place?: boolean | null;
  is_draggable: boolean;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
  scale?: number | null;
  rotation_x?: number | null;
  rotation_y?: number | null;
  rotation_z?: number | null;
}

export interface AutoFitOptions {
  enabled: boolean;
  /** Model bounds keyed by Studio asset id (scripts/measureArModels.js). */
  bounds: Record<string, ModelBounds>;
  limits: ARFitLimits;
}

export const DEFAULT_AUTO_FIT: AutoFitOptions = {
  enabled: AR_AUTO_FIT,
  bounds: measuredBounds as Record<string, ModelBounds>,
  limits: AR_FIT_LIMITS,
};

/**
 * Studio height read as a lift above the floor, in metres: never below the
 * floor, never above `maxLift`.
 */
function floorLift(y: number | null | undefined, maxLift: number): number {
  return typeof y === "number" && Number.isFinite(y) && y > 0 ? Math.min(y, maxLift) : 0;
}

/** Studio values replaced by auto-fit, or null when it does not apply. */
function autoFit<A extends SceneAssetLike>(asset: A, options: AutoFitOptions) {
  if (!options.enabled || !asset.id) return null;
  const bounds = options.bounds[asset.id];
  if (!bounds) return null;
  const fit = fitModel(
    bounds,
    { scale: asset.scale, rotation: [asset.rotation_x, asset.rotation_y, asset.rotation_z] },
    options.limits,
  );
  if (!fit) return null;
  return { scale: fit.scale, position_y: fit.positionY + floorLift(asset.position_y, options.limits.maxLift) };
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
  autoFitOptions: AutoFitOptions = DEFAULT_AUTO_FIT,
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
            ...autoFit(asset, autoFitOptions),
          }
        : asset,
    ),
  };
}
