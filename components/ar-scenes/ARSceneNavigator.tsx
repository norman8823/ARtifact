import { StyleProp, ViewStyle } from "react-native";
import { ViroARSceneNavigator } from "@reactvision/react-viro";
import ArtworkARScene from "./ArtworkARScene";

/**
 * Thin wrapper that owns the ReactVision imports.
 *
 * Why this file exists: importing `@reactvision/react-viro` executes
 * module-scope code that touches native modules, and ViroKit ships as a
 * device-only framework — so on the iOS Simulator the import throws
 * (`Cannot read property 'setJSAnimations' of null`). expo-router eagerly
 * loads every route module, so a static import in `app/arViewer.tsx` crashed
 * the app on launch even when the user never opened AR, which meant the whole
 * app was unrunnable in the Simulator (see Gaps.md #12b).
 *
 * Isolating the imports here lets arViewer require this module lazily, at
 * render time, so the Viro graph is only evaluated when AR is actually
 * opened. On a real device the behavior is unchanged — this still mounts in
 * the same commit as the rest of the AR screen.
 *
 * Deliberately dumb: all AR state, the tap overlay, and the placement
 * ordering invariants stay in arViewer.tsx / ArtworkARScene.tsx.
 */
export interface ARSceneNavigatorProps {
  viroAppProps: {
    sceneId: string;
    onStatusChange: (status: string) => void;
    onPlaced: () => void;
    tapPoint: { x: number; y: number; seq: number } | null;
  };
  style?: StyleProp<ViewStyle>;
}

export default function ARSceneNavigator({
  viroAppProps,
  style,
}: ARSceneNavigatorProps) {
  return (
    <ViroARSceneNavigator
      autofocus={true}
      initialScene={{ scene: ArtworkARScene as any }}
      viroAppProps={viroAppProps}
      style={style}
    />
  );
}
