import { useCallback, useState } from "react";

export interface SceneModel {
  modelUrl: string;
  scale?: [number, number, number];
  rotation?: [number, number, number];
  type: "GLB" | "GLTF" | "OBJ" | "VRX";
}

export function useSceneModel() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getModelBySceneId = useCallback(
    async (sceneId: string): Promise<SceneModel | null> => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual ReactVision Studio Scene API call
        // Example API call pattern:
        // const response = await fetch(`https://studio.reactvision.com/api/scenes/${sceneId}`);
        // const data = await response.json();
        // return { modelUrl: data.modelUrl, type: "GLB" };

        // Temporary direct mapping for development
        const modelMap: Record<string, SceneModel> = {
          // Map sceneId to model URLs
          // These will be populated as scenes are created in ReactVision Studio
        };

        const model = modelMap[sceneId];
        if (!model) {
          throw new Error(`No model found for scene: ${sceneId}`);
        }
        return model;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load model")
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { getModelBySceneId, isLoading, error };
}
