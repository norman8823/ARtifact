import React, { useState, useRef, useCallback, useEffect } from "react";
import { PixelRatio } from "react-native";
import {
  ViroARScene,
  ViroAmbientLight,
  ViroSpotLight,
  Viro3DObject,
  ViroARHitTestResult,
} from "@reactvision/react-viro";

type Viro3DPoint = [number, number, number];
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
  const [userRotationY, setUserRotationY] = useState(0);
  const [userScale, setUserScale] = useState(1.0);

  const modelRef = useRef<any>(null);
  const assetRef = useRef<SceneAPIAsset | null>(null);
  const committedRotationY = useRef(0);
  const committedScale = useRef(1.0);
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
      try {
        const result = await props.arSceneNavigator.rvGetSceneAssets(sceneId);
        if (result.success && result.assets && result.assets.length > 0) {
          assetRef.current = result.assets[0];
          setAsset(result.assets[0]);
          updateStatus("Tap a flat surface to place the artifact");
        } else {
          console.error("rvGetSceneAssets error:", result.error);
          updateStatus("Failed to load AR content");
        }
      } catch (err) {
        console.error("rvGetSceneAssets threw:", err);
        updateStatus("Failed to load AR content");
      }
    };
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, isARReady]);

  // Tap-to-place: hit-test at the exact screen pixel the user tapped.
  // Only accepted on real detected planes — FeaturePoint is intentionally
  // excluded so the model cannot float in mid-air or land on a wall.
  useEffect(() => {
    if (!tapPoint || !isARReady || modelPlaced || !sceneRef.current) return;

    const runHitTest = async () => {
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
          setModelPosition(pos);
          setModelPlaced(true);
          onPlaced?.();
          updateStatus("Drag • Pinch to scale • Two fingers to rotate");
        } else {
          updateStatus("No flat surface detected — try a floor or table");
        }
      } catch (error) {
        console.error("Hit test error:", error);
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

  const handleRotate = useCallback(
    (rotateState: number, rotationFactor: number) => {
      const a = assetRef.current;
      if (!a) return;
      if (rotateState === 3) {
        committedRotationY.current -= rotationFactor;
        setUserRotationY(committedRotationY.current);
      } else {
        modelRef.current?.setNativeProps({
          rotation: [
            a.rotationX,
            a.rotationY + committedRotationY.current - rotationFactor,
            a.rotationZ,
          ],
        });
      }
    },
    [],
  );

  const handlePinch = useCallback(
    (pinchState: number, scaleFactor: number) => {
      const a = assetRef.current;
      if (!a) return;
      const newScale = committedScale.current * scaleFactor;
      if (pinchState === 3) {
        committedScale.current = newScale;
        setUserScale(newScale);
      } else {
        const s = a.scale * newScale;
        modelRef.current?.setNativeProps({ scale: [s, s, s] });
      }
    },
    [],
  );

  const modelScale: Viro3DPoint | undefined = asset
    ? [asset.scale * userScale, asset.scale * userScale, asset.scale * userScale]
    : undefined;
  const modelRotation: Viro3DPoint | undefined = asset
    ? [asset.rotationX, asset.rotationY + userRotationY, asset.rotationZ]
    : undefined;

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
        <Viro3DObject
          ref={modelRef}
          source={{ uri: asset.fileUrl }}
          position={modelPosition}
          scale={modelScale}
          rotation={modelRotation}
          type={inferModelType(asset)}
          dragType={asset.isDraggable !== false ? "FixedToPlane" : undefined}
          dragPlane={{
            planePoint: dragPlaneOrigin.current,
            planeNormal: [0, 1, 0],
            maxDistance: 10,
          }}
          onDrag={handleDrag}
          onRotate={handleRotate}
          onPinch={handlePinch}
        />
      )}
    </ViroARScene>
  );
};

export default ArtworkARScene;
