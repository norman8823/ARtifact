import * as Sentry from "@sentry/react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  StudioSceneNavigator,
  useStudioPlacement,
  type StudioSceneResponse,
} from "@reactvision/react-viro";

/**
 * Thin wrapper that owns the ReactVision imports.
 *
 * Why this file exists: importing `@reactvision/react-viro` executes
 * module-scope code that touches native modules, and ViroKit ships as a
 * device-only framework — so on the iOS Simulator the import throws. expo-router
 * eagerly loads every route module, so a static import in `app/arViewer.tsx`
 * crashed the app on launch even when the user never opened AR (Gaps.md #12b).
 * arViewer requires this module lazily, at render time, so the Viro graph is
 * only evaluated when AR is actually opened.
 *
 * Rendering is Studio's `StudioSceneNavigator`: it fetches the scene, runs
 * tap-to-place with its own overlay (removed once the model is placed, so drag
 * and pinch reach the model) and handles drag. Upright camera-facing placement,
 * a drag plane at the placed height and clamped pinch-to-scale come from
 * `patches/@reactvision+react-viro+3.0.3.patch`. This wrapper only translates
 * Studio's events into the screen's status line.
 */
export interface ARSceneNavigatorProps {
  sceneId: string;
  onStatusChange: (status: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Logs (once per load) when a scene isn't set up for this viewer. The scene
 * still renders, but without tap-to-place the model appears at its authored
 * position, and without is_draggable it can't be moved.
 */
function reportSceneCompatibility(
  sceneId: string,
  scene: StudioSceneResponse,
): boolean {
  const model = scene.assets.find((a) => a.asset_type_name === "3D-MODEL");
  const tapToPlace = !!model?.tap_to_place && !model.trigger_image_url;
  if (model && tapToPlace && model.is_draggable) return true;
  Sentry.captureMessage("AR scene not configured for tap-to-place viewer", {
    level: "warning",
    tags: { component: "ar_scene", ar_stage: "scene_config" },
    extra: {
      sceneId,
      hasModel: !!model,
      tapToPlace: model?.tap_to_place ?? null,
      isDraggable: model?.is_draggable ?? null,
      planeDetection: scene.scene.plane_detection,
    },
  });
  return tapToPlace;
}

export default function ARSceneNavigator({
  sceneId,
  onStatusChange,
  style,
}: ARSceneNavigatorProps) {
  const { isPlacing, showMiss } = useStudioPlacement();
  const [loaded, setLoaded] = useState(false);
  const wasPlacingRef = useRef(false);

  // Scene ready → awaiting a tap → placed are three different moments; the
  // placement store is the only one of them Studio exposes after load.
  useEffect(() => {
    if (!loaded) return;
    if (isPlacing) {
      wasPlacingRef.current = true;
      onStatusChange(
        showMiss
          ? "No surface found — move your phone slowly and try again"
          : "Tap a flat surface to place the artifact",
      );
    } else if (wasPlacingRef.current) {
      wasPlacingRef.current = false;
      Sentry.addBreadcrumb({
        category: "ar",
        level: "info",
        message: "model placed",
        data: { sceneId },
      });
      onStatusChange("Drag to move • Pinch to resize");
    }
  }, [loaded, isPlacing, showMiss, sceneId, onStatusChange]);

  const handleSceneLoaded = useCallback(
    (scene: StudioSceneResponse) => {
      setLoaded(true);
      Sentry.addBreadcrumb({
        category: "ar",
        level: "info",
        message: "studio scene loaded",
        data: { sceneId, assetCount: scene.assets.length },
      });
      // A scene without tap-to-place shows the model at its authored spot as
      // soon as tracking settles, so there is no tap step to prompt for.
      onStatusChange(
        reportSceneCompatibility(sceneId, scene)
          ? "Scanning your space..."
          : "Look around to find the artifact",
      );
    },
    [sceneId, onStatusChange],
  );

  const handleError = useCallback(
    (error: Error) => {
      Sentry.captureException(error, {
        tags: { component: "ar_scene", ar_stage: "scene_load" },
        extra: { sceneId },
      });
      onStatusChange("Failed to load AR content");
    },
    [sceneId, onStatusChange],
  );

  return (
    <StudioSceneNavigator
      sceneId={sceneId}
      autofocus
      onSceneLoaded={handleSceneLoaded}
      onError={handleError}
      // The screen draws its own status line and top chrome (back / info).
      placementIndicator={false}
      style={style as ViewStyle}
    />
  );
}
