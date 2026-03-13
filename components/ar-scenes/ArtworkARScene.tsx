import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dimensions, PixelRatio } from "react-native";
import {
  ViroARScene,
  ViroAmbientLight,
  ViroSpotLight,
  Viro3DObject,
  ViroNode,
  ViroSphere,
  ViroMaterials,
  ViroARHitTestResult,
} from "@reactvision/react-viro";

type Viro3DPoint = [number, number, number];

interface ArtworkARSceneProps {
  arSceneNavigator: {
    viroAppProps: {
      modelUrl: string;
      modelType: "GLB" | "GLTF" | "OBJ" | "VRX";
      modelScale?: [number, number, number];
      modelRotation?: [number, number, number];
      onStatusChange?: (status: string) => void;
      placeTrigger: number;
    };
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

const ArtworkARScene = (props: ArtworkARSceneProps) => {
  const {
    modelUrl,
    modelType,
    modelScale = [0.3, 0.3, 0.3],
    modelRotation = [0, 0, 0],
    onStatusChange,
    placeTrigger,
  } = props.arSceneNavigator.viroAppProps;

  const sceneRef = useRef<any>(null);
  const [isARReady, setIsARReady] = useState(false);
  const [modelPlaced, setModelPlaced] = useState(false);
  const [modelPosition, setModelPosition] = useState<Viro3DPoint | null>(null);
  const [cursorPosition, setCursorPosition] = useState<Viro3DPoint | null>(
    null
  );
  const [surfaceFound, setSurfaceFound] = useState(false);

  const targetCursorPosition = useRef<Viro3DPoint | null>(null);
  const currentCursorPosition = useRef<Viro3DPoint | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const updateStatus = useCallback(
    (status: string) => {
      onStatusChange?.(status);
    },
    [onStatusChange]
  );

  // Linear interpolation for smooth cursor movement
  const lerpVector = useCallback(
    (start: Viro3DPoint, end: Viro3DPoint, factor: number): Viro3DPoint => {
      return [
        start[0] + (end[0] - start[0]) * factor,
        start[1] + (end[1] - start[1]) * factor,
        start[2] + (end[2] - start[2]) * factor,
      ];
    },
    []
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
          0.3
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
    if (placeTrigger > 0 && cursorPosition && !modelPlaced) {
      setModelPosition([...cursorPosition]);
      setModelPlaced(true);
      updateStatus("Artifact placed! Drag to reposition.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeTrigger]);

  // Handle AR tracking initialization
  const handleTrackingUpdated = useCallback(
    (state: number, _reason: number) => {
      if (state === 2 && !isARReady) {
        setIsARReady(true);
        updateStatus("AR Ready - point at a flat surface");
      } else if (state === 1) {
        setIsARReady(true);
        updateStatus("Tracking limited - move device slowly");
      }
    },
    [isARReady, updateStatus]
  );

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
      {modelPlaced && modelPosition && (
        <ViroNode position={modelPosition}>
          <Viro3DObject
            source={{ uri: modelUrl }}
            position={[0, 0, 0]}
            scale={modelScale}
            rotation={modelRotation}
            type={modelType}
            dragType="FixedToPlane"
            dragPlane={{
              planePoint: [0, 0, 0],
              planeNormal: [0, 0.5, 0],
              maxDistance: 5,
            }}
            onDrag={() => {}}
          />
        </ViroNode>
      )}
    </ViroARScene>
  );
};

export default ArtworkARScene;
