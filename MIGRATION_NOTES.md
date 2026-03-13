# Migration: 8th Wall WebView -> ReactVision (ViroReact) Native AR

## Overview

Replaced the 8th Wall WebView/Safari-based AR implementation with native AR rendering using ReactVision (`@reactvision/react-viro`). The app now renders 3D models directly in a native AR scene with tap-to-place functionality powered by AR hit tests.

## Changes

### New Files

- **`components/ar-scenes/ArtworkARScene.tsx`** - ViroARScene component that implements:
  - Continuous AR hit test from screen center (100ms interval) to detect surfaces
  - Hit test prioritization: ExistingPlaneUsingExtent > ExistingPlane > FeaturePoint
  - Cursor indicator showing detected surface position
  - Tap-to-place: places a `Viro3DObject` at the cursor location when user presses "Place"
  - Drag support (`FixedToPlane`) after placement
  - Ambient + spot lighting for model visibility
  - Communication with parent via `viroAppProps`

- **`src/hooks/useSceneModel.ts`** - Hook that resolves a `sceneId` to a 3D model URL. Uses a temporary hardcoded mapping (`Record<string, SceneModel>`) until the ReactVision Studio Scene API is available.

### Modified Files

- **`app/arViewer.tsx`** - Fully rewritten:
  - Removed: WebView / Safari Linking for 8th Wall URLs
  - Added: `ViroARSceneNavigator` with `ArtworkARScene` as the initial scene
  - New UI overlays: crosshair, AR status badge, "Place" button
  - Receives `sceneId` (instead of `arImage`) via route params
  - Fetches model info via `useSceneModel` hook

- **`app/artDetail.tsx`** - Updated navigation params from `arImage` to `sceneId` when launching AR viewer

- **`src/hooks/useArtwork.ts`** - Added `sceneId: string | null` to the `Artwork` interface and data mapping

- **`amplify/backend/api/artifact/schema.graphql`** - Added `sceneId: String` field to the `Artwork` type

- **`app.json`** - Added `@reactvision/react-viro` plugin with AR mode config and iOS camera/microphone/photos permissions

- **`metro.config.js`** - Added `glb` and `gltf` to `assetExts` for 3D model bundling

- **`package.json`** - Upgraded to Expo SDK 54 (React Native 0.81.5, React 19.1.0) and added `@reactvision/react-viro@^2.53.1`

## Breaking Changes

- **Expo Go no longer supported** - ViroReact requires native builds. Use `npx expo prebuild --clean && npx expo run:ios` instead of `expo start`.
- **`arImage` param replaced by `sceneId`** - Any artwork that had `arImage` set must now have a `sceneId` value pointing to a ReactVision scene or a key in the `useSceneModel` mapping.

## Pending Steps

1. Run `amplify push` to regenerate GraphQL types (`src/API.ts`, `src/graphql/*`) with the new `sceneId` field
2. Run `npx expo prebuild --clean` to generate the native iOS project with ViroReact
3. Populate `sceneId` values in the database for artworks with `hasAR: true`
4. Add model URLs to the `useSceneModel` hook's temporary mapping
5. Test with `npx expo run:ios`
