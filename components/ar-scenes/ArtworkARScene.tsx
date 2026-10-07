import * as Sentry from "@sentry/react-native";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { PixelRatio } from "react-native";
import {
  ViroARScene,
  ViroAmbientLight,
  ViroSpotLight,
  Viro3DObject,
  ViroNode,
  ViroARHitTestResult,
} from "@reactvision/react-viro";
import {
  clampUserScale,
  yawFacingCamera,
  type Vec3,
} from "@/src/utils/arPlacement";

type Viro3DPoint = Vec3;
type ModelType = "GLB" | "GLTF" | "OBJ" | "VRX";

interface SceneAPIAsset {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileSize?: number;
  assetTypeName: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
  latitude?: number;
  longitude?: number;
  isDraggable?: boolean;
  triggerImageUrl?: string;
  triggerImageOrientation?: string;
  triggerImagePhysicalWidthM?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ArtworkARSceneProps {
  arSceneNavigator: {
    viroAppProps: {
      sceneId: string;
      onStatusChange?: (status: string) => void;
      onPlaced?: () => void;
      tapPoint?: { x: number; y: number; seq: number } | null;
    };
    rvGetSceneAssets: (sceneId: string) => Promise<{
      success: boolean;
      assets?: SceneAPIAsset[];
      error?: string;
    }>;
  };
}

function inferModelType(asset: SceneAPIAsset): ModelType {
  const typeName = asset.assetTypeName.toUpperCase();
  if (typeName.includes("GLB")) return "GLB";
  if (typeName.includes("GLTF")) return "GLTF";
  if (typeName.includes("OBJ")) return "OBJ";
  if (typeName.includes("VRX")) return "VRX";
  const url = asset.fileUrl.toLowerCase();
  if (url.endsWith(".glb")) return "GLB";
  if (url.endsWith(".gltf")) return "GLTF";
  if (url.endsWith(".obj")) return "OBJ";
  if (url.endsWith(".vrx")) return "VRX";
  return "GLB";
}

const ArtworkARScene = (props: ArtworkARSceneProps) => {
  const { sceneId, onStatusChange, onPlaced, tapPoint } =
    props.arSceneNavigator.viroAppProps;

  const sceneRef = useRef<any>(null);
  const [isARReady, setIsARReady] = useState(false);
  const [modelPlaced, setModelPlaced] = useState(false);
  const [modelPosition, setModelPosition] = useState<Viro3DPoint | null>(null);

  const [asset, setAsset] = useState<SceneAPIAsset | null>(null);
  // Set once at placement so the model's front faces the user, then fixed —
  // deliberately not updated as the camera moves.
  const [placementYaw, setPlacementYaw] = useState(0);
  const [userScale, setUserScale] = useState(1.0);

  // The placement node owns position, the placement yaw, drag and pinch; the
  // model inside it keeps the Studio-authored rotation and scale. Splitting
  // them keeps the yaw a pure rotation about world up (the model stays
  // upright) whatever the authored X/Z rotation is. Viro bubbles gestures from
  // the model's geometry up to the first ancestor that handles them.
  const placementNodeRef = useRef<any>(null);
  const assetRef = useRef<SceneAPIAsset | null>(null);
  const committedScale = useRef(1.0);
  // Guards the async hit-test + camera query so a second tap during it can't
  // place the model twice.
  const placingRef = useRef(false);
  // Locked at placement height so the drag plane doesn't shift during drag.
  const dragPlaneOrigin = useRef<Viro3DPoint>([0, 0, 0]);

  const updateStatus = useCallback(
    (status: string) => {
      onStatusChange?.(status);
    },
    [onStatusChange],
  );

  // Fetch scene assets once AR tracking is ready
  useEffect(() => {
    if (!isARReady) return;
    const fetchAssets = async () => {
      updateStatus("Loading AR content...");
      Sentry.addBreadcrumb({
        category: "ar",
        level: "info",
        message: "rvGetSceneAssets: requesting",
        data: { sceneId },
      });
      try {
        const result = await props.arSceneNavigator.rvGetSceneAssets(sceneId);
        if (result.success && result.assets && result.assets.length > 0) {
          assetRef.current = result.assets[0];
          setAsset(result.assets[0]);
          Sentry.addBreadcrumb({
            category: "ar",
            level: "info",
            message: "rvGetSceneAssets: loaded",
            data: { sceneId, assetCount: result.assets.length },
          });
          updateStatus("Tap a flat surface to place the artifact");
        } else {
          // Both this branch and the catch below show the user the same
          // "Failed to load AR content". Report them distinctly: an SDK that
          // answered unsuccessfully and one that threw are different faults,
          // and in a release build console.error goes nowhere (Gaps #20).
          console.error("rvGetSceneAssets error:", result.error);
          Sentry.captureMessage("AR scene assets failed to load", {
            level: "error",
            tags: { component: "ar_scene", ar_stage: "asset_fetch" },
            extra: {
              sceneId,
              outcome: "returned_unsuccessful",
              success: result.success,
              assetCount: result.assets?.length ?? 0,
              // The SDK's own error — the thing that was previously lost.
              sdkError:
                typeof result.error === "string"
                  ? result.error
                  : JSON.stringify(result.error ?? null),
            },
          });
          updateStatus("Failed to load AR content");
        }
      } catch (err) {
        console.error("rvGetSceneAssets threw:", err);
        Sentry.captureException(err, {
          tags: { component: "ar_scene", ar_stage: "asset_fetch" },
          extra: { sceneId, outcome: "threw" },
        });
        updateStatus("Failed to load AR content");
      }
    };
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, isARReady]);

  // Yaw that turns the model's front toward where the user stands at the
  // moment of placement. Falls back to the authored orientation (0) if the
  // camera query fails — placement itself must never be blocked by it.
  const resolvePlacementYaw = async (pos: Viro3DPoint): Promise<number> => {
    try {
      const camera = await sceneRef.current.getCameraOrientationAsync();
      return yawFacingCamera(pos, camera.position, camera.forward);
    } catch (error) {
      Sentry.addBreadcrumb({
        category: "ar",
        level: "warning",
        message: "getCameraOrientationAsync failed; using authored orientation",
        data: { error: String(error) },
      });
      return 0;
    }
  };

  // Tap-to-place: hit-test at the exact screen pixel the user tapped.
  // Only accepted on real detected planes — FeaturePoint is intentionally
  // excluded so the model cannot float in mid-air or land on a wall.
  useEffect(() => {
    if (!tapPoint || !isARReady || modelPlaced || !sceneRef.current) return;
    // Nothing to place until the scene's asset has arrived; the status line
    // still reads "Loading AR content..." so the user knows to tap again.
    if (!assetRef.current || placingRef.current) return;

    const runHitTest = async () => {
      placingRef.current = true;
      try {
        const pr = PixelRatio.get();
        const x = tapPoint.x * pr;
        const y = tapPoint.y * pr;

        const results: ViroARHitTestResult[] =
          await sceneRef.current.performARHitTestWithPoint(x, y);

        const planeHit =
          results?.find((r) => r.type === "ExistingPlaneUsingExtent") ??
          results?.find((r) => r.type === "ExistingPlane") ??
          results?.find((r) => r.type === "FeaturePoint");

        if (planeHit) {
          const pos = planeHit.transform.position as Viro3DPoint;
          dragPlaneOrigin.current = pos;
          setPlacementYaw(await resolvePlacementYaw(pos));
          setModelPosition(pos);
          setModelPlaced(true);
          onPlaced?.();
          // Placed ≠ visible: the model streams in after this. Viro3DObject's
          // onLoadEnd/onError below move the status on from here.
          updateStatus("Loading model...");
        } else {
          updateStatus("No flat surface detected — try a floor or table");
        }
      } catch (error) {
        console.error("Hit test error:", error);
      } finally {
        placingRef.current = false;
      }
    };

    runHitTest();
    // tapPoint.seq changes on every new tap, driving re-execution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapPoint]);

  const handleTrackingUpdated = useCallback(
    (state: number, _reason: number) => {
      if (state === 2 && !isARReady) {
        setIsARReady(true);
        updateStatus(
          asset ? "Tap a flat surface to place the artifact" : "Loading AR content...",
        );
      } else if (state === 1) {
        setIsARReady(true);
        updateStatus("Tracking limited — move device slowly");
      }
    },
    [isARReady, asset, updateStatus],
  );

  const handleDrag = useCallback((dragToPos: Viro3DPoint) => {
    setModelPosition(dragToPos);
  }, []);

  // Pinch resizes the model (the placement node), never the camera. Live
  // updates go through setNativeProps to avoid a React render per frame; the
  // clamped value is committed to state when the gesture ends (state 3).
  const handlePinch = useCallback(
    (pinchState: number, scaleFactor: number) => {
      const s = clampUserScale(committedScale.current * scaleFactor);
      if (pinchState === 3) {
        committedScale.current = s;
        setUserScale(s);
      } else {
        placementNodeRef.current?.setNativeProps({ scale: [s, s, s] });
      }
    },
    [],
  );

  const handleModelLoadEnd = useCallback(() => {
    Sentry.addBreadcrumb({
      category: "ar",
      level: "info",
      message: "model loaded",
      data: { sceneId },
    });
    updateStatus("Drag to move • Pinch to resize");
  }, [sceneId, updateStatus]);

  const handleModelError = useCallback(
    (event: { nativeEvent?: { error?: unknown } }) => {
      const error = event?.nativeEvent?.error;
      console.error("Viro3DObject load error:", error);
      Sentry.captureMessage("AR model failed to load", {
        level: "error",
        tags: { component: "ar_scene", ar_stage: "model_load" },
        extra: {
          sceneId,
          fileUrl: assetRef.current?.fileUrl,
          error: typeof error === "string" ? error : JSON.stringify(error ?? null),
        },
      });
      updateStatus("Failed to load the 3D model");
    },
    [sceneId, updateStatus],
  );

  const modelScale: Viro3DPoint | undefined = asset
    ? [asset.scale, asset.scale, asset.scale]
    : undefined;
  const modelRotation: Viro3DPoint | undefined = asset
    ? [asset.rotationX, asset.rotationY, asset.rotationZ]
    : undefined;
  const isDraggable = asset?.isDraggable !== false;

  return (
    <ViroARScene ref={sceneRef} onTrackingUpdated={handleTrackingUpdated}>
      <ViroAmbientLight color="#FFFFFF" intensity={200} />
      <ViroSpotLight
        innerAngle={5}
        outerAngle={25}
        direction={[0, -1, 0]}
        position={[0, 5, 0]}
        color="#FFFFFF"
        castsShadow={true}
      />

      {modelPlaced && modelPosition && asset && (
        <ViroNode
          ref={placementNodeRef}
          position={modelPosition}
          rotation={[0, placementYaw, 0]}
          scale={[userScale, userScale, userScale]}
          dragType={isDraggable ? "FixedToPlane" : undefined}
          dragPlane={{
            planePoint: dragPlaneOrigin.current,
            planeNormal: [0, 1, 0],
            maxDistance: 10,
          }}
          // Viro enables native drag only when onDrag is set.
          onDrag={isDraggable ? handleDrag : undefined}
          onPinch={handlePinch}
        >
          <Viro3DObject
            source={{ uri: asset.fileUrl }}
            scale={modelScale}
            rotation={modelRotation}
            type={inferModelType(asset)}
            onLoadEnd={handleModelLoadEnd}
            onError={handleModelError}
          />
        </ViroNode>
      )}
    </ViroARScene>
  );
};

export default ArtworkARScene;
