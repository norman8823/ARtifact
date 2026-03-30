import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dimensions, PixelRatio } from "react-native";
import {
  ViroARScene,
  ViroAmbientLight,
  ViroSpotLight,
  Viro3DObject,
  ViroSphere,
  ViroMaterials,
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
      placeTrigger: number;
    };
    rvGetSceneAssets: (sceneId: string) => Promise<{
      success: boolean;
      assets?: SceneAPIAsset[];
      error?: string;
    }>;
  };
}

// Register materials for the cursor indicator
ViroMaterials.createMaterials({
  cursorMaterial: {
    diffuseColor: "#FFFFFF",
    lightingModel: "Constant",
  },
  cursorReadyMaterial: {
    diffuseColor: "#00FF88",
    lightingModel: "Constant",
  },
});

function inferModelType(asset: SceneAPIAsset): ModelType {
  const typeName = asset.assetTypeName.toUpperCase();
  if (typeName.includes("GLB")) return "GLB";
  if (typeName.includes("GLTF")) return "GLTF";
  if (typeName.includes("OBJ")) return "OBJ";
  if (typeName.includes("VRX")) return "VRX";
  // Fallback: check file extension
  const url = asset.fileUrl.toLowerCase();
  if (url.endsWith(".glb")) return "GLB";
  if (url.endsWith(".gltf")) return "GLTF";
  if (url.endsWith(".obj")) return "OBJ";
  if (url.endsWith(".vrx")) return "VRX";
  return "GLB";
}

const ArtworkARScene = (props: ArtworkARSceneProps) => {
  const { sceneId, onStatusChange, placeTrigger } =
    props.arSceneNavigator.viroAppProps;

  const sceneRef = useRef<any>(null);
  const [isARReady, setIsARReady] = useState(false);
  const [modelPlaced, setModelPlaced] = useState(false);
  const [modelPosition, setModelPosition] = useState<Viro3DPoint | null>(null);
  const [cursorPosition, setCursorPosition] = useState<Viro3DPoint | null>(null);
  const [surfaceFound, setSurfaceFound] = useState(false);

  const [asset, setAsset] = useState<SceneAPIAsset | null>(null);
  // Committed transform state (written on gesture end, read for prop)
  const [userRotationY, setUserRotationY] = useState(0);
  const [userScale, setUserScale] = useState(1.0);

  const targetCursorPosition = useRef<Viro3DPoint | null>(null);
  const currentCursorPosition = useRef<Viro3DPoint | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const modelRef = useRef<any>(null);
  const assetRef = useRef<SceneAPIAsset | null>(null);
  // Accumulated committed values — updated on gesture end so in-gesture
  // setNativeProps calls can read the pre-gesture baseline from a ref.
  const committedRotationY = useRef(0);
  const committedScale = useRef(1.0);
  // Set once on placement; never changes. Used as dragPlane anchor so the
  // constraint plane doesn't shift when modelPosition state updates mid-drag.
  const dragPlaneOrigin = useRef<Viro3DPoint>([0, 0, 0]);

  const updateStatus = useCallback(
    (status: string) => {
      onStatusChange?.(status);
    },
    [onStatusChange],
  );

  // Fetch scene assets once the AR session is ready
  useEffect(() => {
    if (!isARReady) return;
    const fetchAssets = async () => {
      updateStatus("Loading AR content...");
      try {
        const result = await props.arSceneNavigator.rvGetSceneAssets(sceneId);
        if (result.success && result.assets && result.assets.length > 0) {
          assetRef.current = result.assets[0];
          setAsset(result.assets[0]);
          updateStatus("AR Ready - point at a flat surface");
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

  // Linear interpolation for smooth cursor movement
  const lerpVector = useCallback(
    (start: Viro3DPoint, end: Viro3DPoint, factor: number): Viro3DPoint => {
      return [
        start[0] + (end[0] - start[0]) * factor,
        start[1] + (end[1] - start[1]) * factor,
        start[2] + (end[2] - start[2]) * factor,
      ];
    },
    [],
  );

  // Continuous hit test from screen center
  const performCenterHitTest = useCallback(async () => {
    if (!sceneRef.current || !isARReady || modelPlaced) return;

    try {
      const screenData = Dimensions.get("window");
      const centerX = (screenData.width * PixelRatio.get()) / 2;
      const centerY = (screenData.height * PixelRatio.get()) / 2;

      const results: ViroARHitTestResult[] =
        await sceneRef.current.performARHitTestWithPoint(centerX, centerY);

      if (results && results.length > 0) {
        // Prioritize: ExistingPlaneUsingExtent > ExistingPlane > FeaturePoint
        const bestResult =
          results.find((r) => r.type === "ExistingPlaneUsingExtent") ||
          results.find((r) => r.type === "ExistingPlane") ||
          results.find((r) => r.type === "FeaturePoint") ||
          results[0];

        const position = bestResult.transform.position as Viro3DPoint;
        targetCursorPosition.current = position;

        if (!currentCursorPosition.current) {
          currentCursorPosition.current = position;
        }

        if (!surfaceFound) {
          setSurfaceFound(true);
        }

        setCursorPosition(currentCursorPosition.current);
        updateStatus("Surface detected - tap Place to position artifact");
      } else {
        targetCursorPosition.current = null;
        currentCursorPosition.current = null;
        setCursorPosition(null);
        setSurfaceFound(false);
        updateStatus("Point at a flat surface...");
      }
    } catch (error) {
      console.error("Hit test error:", error);
    }
  }, [isARReady, modelPlaced, surfaceFound, updateStatus]);

  // Smooth cursor animation loop
  useEffect(() => {
    const animate = () => {
      if (targetCursorPosition.current && currentCursorPosition.current) {
        const newPosition = lerpVector(
          currentCursorPosition.current,
          targetCursorPosition.current,
          0.3,
        );
        currentCursorPosition.current = newPosition;
        setCursorPosition(newPosition);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [lerpVector]);

  // Continuous hit test interval (10 times per second)
  useEffect(() => {
    if (!isARReady || modelPlaced) return;
    const interval = setInterval(performCenterHitTest, 100);
    return () => clearInterval(interval);
  }, [isARReady, modelPlaced, performCenterHitTest]);

  // Handle place trigger from parent
  useEffect(() => {
    if (placeTrigger > 0 && currentCursorPosition.current && !modelPlaced) {
      const pos = [...currentCursorPosition.current] as Viro3DPoint;
      dragPlaneOrigin.current = pos; // lock plane anchor at placement height
      setModelPosition(pos);
      setModelPlaced(true);
      updateStatus("Drag • Pinch to scale • Two fingers to rotate");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeTrigger]);

  // Handle AR tracking initialization
  const handleTrackingUpdated = useCallback(
    (state: number, _reason: number) => {
      if (state === 2 && !isARReady) {
        setIsARReady(true);
        updateStatus(
          asset
            ? "AR Ready - point at a flat surface"
            : "Loading AR content...",
        );
      } else if (state === 1) {
        setIsARReady(true);
        updateStatus("Tracking limited - move device slowly");
      }
    },
    [isARReady, asset, updateStatus],
  );

  // Drag: update position state on every event (Viro handles plane constraint
  // natively; we just persist where it landed).
  const handleDrag = useCallback((dragToPos: Viro3DPoint) => {
    setModelPosition(dragToPos);
  }, []);

  // Rotate: rotationFactor is cumulative from gesture start (degrees).
  // During gesture: bypass React render with setNativeProps for smoothness.
  // On gesture end: commit to state so the prop stays in sync.
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

  // Pinch: scaleFactor resets to 1.0 at gesture start and is multiplicative.
  // During gesture: setNativeProps. On end: commit to state.
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

      {/* Cursor indicator at detected surface (before placement) */}
      {!modelPlaced && cursorPosition && (
        <ViroSphere
          position={[
            cursorPosition[0],
            cursorPosition[1] + 0.02,
            cursorPosition[2],
          ]}
          radius={0.02}
          materials={[surfaceFound ? "cursorReadyMaterial" : "cursorMaterial"]}
        />
      )}

      {/* 3D Model placed at tap position */}
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
            // Use the fixed placement origin so the plane doesn't shift
            // as modelPosition state updates during drag.
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
