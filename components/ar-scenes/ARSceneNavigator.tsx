import * as Sentry from "@sentry/react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  StudioSceneNavigator,
  useStudioPlacement,
  type StudioSceneResponse,
} from "@reactvision/react-viro";
import {
  applyViewerDefaults,
  hasPlaceableModel,
} from "@/src/utils/arSceneDefaults";

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
 * and pinch reach the model) and handles drag. Every scene gets the viewer
 * defaults in `src/utils/arSceneDefaults.ts` (tap-to-place, draggable, floor
 * drag) whatever its Studio settings. Upright camera-facing placement,
 * a drag plane at the placed height and clamped pinch-to-scale come from
 * `patches/@reactvision+react-viro+3.0.3.patch`. This wrapper only translates
 * Studio's events into the screen's status line.
 */
export interface ARSceneNavigatorProps {
  sceneId: string;
  onStatusChange: (status: string) => void;
  style?: StyleProp<ViewStyle>;
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
      // The scene arrives here with the viewer defaults already applied, so
      // any scene with a model goes on to the tap prompt.
      if (hasPlaceableModel(scene)) {
        onStatusChange("Scanning your space...");
        return;
      }
      Sentry.captureMessage("AR scene has no 3D model", {
        level: "warning",
        tags: { component: "ar_scene", ar_stage: "scene_config" },
        extra: { sceneId, assetCount: scene.assets.length },
      });
      onStatusChange("This artwork has no 3D model yet");
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
      transformSceneData={applyViewerDefaults}
      onSceneLoaded={handleSceneLoaded}
      onError={handleError}
      // The screen draws its own status line and top chrome (back / info).
      placementIndicator={false}
      style={style as ViewStyle}
    />
  );
}
