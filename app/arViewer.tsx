import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import type { ARSceneNavigatorProps } from "@/components/ar-scenes/ARSceneNavigator";
import { useGoBack } from "@/src/hooks/useGoBack";
import { FontAwesome } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

// --- Debug flag: bypass the sceneId param and use a fixed test scene ---------
// Env-driven and `__DEV__`-gated so it CANNOT ship enabled, matching the
// premium dev bypass in EntitlementContext. It was previously a bare
// `const AR_TEST_MODE = false` that someone had to remember to flip back —
// committing it as `true` would have routed every AR view in a release build to
// this one hardcoded scene (Gaps #14).
const AR_TEST_MODE =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_AR_TEST_MODE === "1";
const AR_TEST_SCENE_ID = "73f3603f-5579-4642-ad27-fccfc87922a3";
// ---------------------------------------------------------------------------

// ReactVision is loaded lazily, on first render of this screen, NOT at module
// scope. expo-router eagerly requires every route module, and importing Viro
// executes native-touching module code that throws on the iOS Simulator
// (ViroKit is a device-only framework) — a static import here crashed the
// whole app on launch, even for users who never opened AR. See Gaps.md #12b.
//
// This is a synchronous require, not React.lazy, so the navigator still mounts
// in the SAME commit as the tap overlay below. Device behavior is unchanged;
// no new async window opens between the overlay appearing and the scene
// existing. The type-only import above is erased at compile time.
let cachedNavigator: React.ComponentType<ARSceneNavigatorProps> | null = null;
function loadARSceneNavigator(): React.ComponentType<ARSceneNavigatorProps> {
  if (!cachedNavigator) {
    // Deferring to render time is the whole point here; a static import would
    // crash launch on the Simulator.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedNavigator = require("@/components/ar-scenes/ARSceneNavigator").default;
  }
  return cachedNavigator!;
}

export default function ARViewerScreen() {
  const goBack = useGoBack();
  const params = useLocalSearchParams();
  const artworkTitle = Array.isArray(params.title)
    ? params.title[0]
    : params.title || "Artwork";
  const sceneId = Array.isArray(params.sceneId)
    ? params.sceneId[0]
    : params.sceneId;

  const effectiveSceneId = AR_TEST_MODE ? AR_TEST_SCENE_ID : sceneId;

  const [arStatus, setArStatus] = useState("Initializing AR...");
  const [isModelPlaced, setIsModelPlaced] = useState(false);
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number; seq: number } | null>(null);

  const handleBack = goBack;

  const handleStatusChange = (status: string) => {
    setArStatus(status);
  };

  // No sceneId provided (bypassed in test mode)
  if (!effectiveSceneId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <FontAwesome
            name="exclamation-triangle"
            size={48}
            color={Colors.darkMedGray}
          />
          <ThemedText style={styles.errorTitle}>AR Not Available</ThemedText>
          <ThemedText style={styles.errorMessage}>
            No AR scene configured for this artwork.
          </ThemedText>
          <Pressable style={styles.retryButton} onPress={handleBack}>
            <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </>
    );
  }

  // Resolved here, past the no-sceneId early return, so the Viro graph is only
  // evaluated when an AR scene is actually going to render.
  const ARSceneNavigator = loadARSceneNavigator();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* AR Scene Navigator */}
        <ARSceneNavigator
          viroAppProps={{
            sceneId: effectiveSceneId,
            onStatusChange: handleStatusChange,
            onPlaced: () => setIsModelPlaced(true),
            tapPoint,
          }}
          style={styles.arNavigator}
        />

        {/* Tap overlay — captures real screen coordinates before placement.
            Removed after placement so drag/pinch/rotate reach Viro directly. */}
        {!isModelPlaced && (
          <View
            style={StyleSheet.absoluteFillObject}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(evt) => {
              const { pageX, pageY } = evt.nativeEvent;
              setTapPoint({ x: pageX, y: pageY, seq: Date.now() });
            }}
          />
        )}

        {/* Status bar */}
        <View style={styles.statusContainer} pointerEvents="none">
          <View style={styles.statusBadge}>
            <ThemedText style={styles.statusText}>{arStatus}</ThemedText>
          </View>
        </View>

        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <FontAwesome name="arrow-left" size={18} color={Colors.lightGray} />
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </Pressable>
        </View>

        {/* Info Button */}
        <View style={styles.infoButtonContainer}>
          <Pressable
            style={styles.infoButton}
            onPress={() =>
              Alert.alert(
                "AR Experience",
                `Viewing AR content for: \n${artworkTitle}`,
                [{ text: "OK" }],
              )
            }
          >
            <FontAwesome name="info" size={16} color={Colors.lightGray} />
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  arNavigator: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    padding: 20,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.darkMedGray,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.darkMedGray,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: Colors.lightGray,
  },
  statusContainer: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: Colors.lightGray,
    fontSize: 13,
    textAlign: "center",
  },
  backButtonContainer: {
    position: "absolute",
    top: 70,
    left: 20,
    zIndex: 1000,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  backButtonText: {
    color: Colors.lightGray,
  },
  infoButtonContainer: {
    position: "absolute",
    top: 70,
    right: 20,
    zIndex: 1000,
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
