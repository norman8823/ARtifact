import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import ArtworkARScene from "@/components/ar-scenes/ArtworkARScene";
import { FontAwesome } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { ViroARSceneNavigator } from "@reactvision/react-viro";

// --- Debug flag: set to true to bypass sceneId param and use a test scene ---
const AR_TEST_MODE = false;
const AR_TEST_SCENE_ID = "73f3603f-5579-4642-ad27-fccfc87922a3";
// ---------------------------------------------------------------------------

export default function ARViewerScreen() {
  const params = useLocalSearchParams();
  const artworkTitle = Array.isArray(params.title)
    ? params.title[0]
    : params.title || "Artwork";
  const sceneId = Array.isArray(params.sceneId)
    ? params.sceneId[0]
    : params.sceneId;

  const effectiveSceneId = AR_TEST_MODE ? AR_TEST_SCENE_ID : sceneId;

  const [arStatus, setArStatus] = useState("Initializing AR...");
  const [placeTrigger, setPlaceTrigger] = useState(0);
  const [isModelPlaced, setIsModelPlaced] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handlePlace = () => {
    setPlaceTrigger((prev) => prev + 1);
    setIsModelPlaced(true);
  };

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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* AR Scene Navigator */}
        <ViroARSceneNavigator
          autofocus={true}
          initialScene={{ scene: ArtworkARScene as any }}
          viroAppProps={{
            sceneId: effectiveSceneId,
            onStatusChange: handleStatusChange,
            placeTrigger,
          }}
          style={styles.arNavigator}
        />

        {/* Crosshair at screen center */}
        {!isModelPlaced && (
          <View style={styles.crosshairContainer} pointerEvents="none">
            <View style={styles.crosshairLineH} />
            <View style={styles.crosshairLineV} />
            <View style={styles.crosshairDot} />
          </View>
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

        {/* Place Button */}
        {!isModelPlaced && (
          <View style={styles.placeButtonContainer}>
            <Pressable style={styles.placeButton} onPress={handlePlace}>
              <FontAwesome
                name="crosshairs"
                size={20}
                color={Colors.lightGray}
              />
              <ThemedText style={styles.placeButtonText}>Place</ThemedText>
            </Pressable>
          </View>
        )}

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
  crosshairContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  crosshairLineH: {
    position: "absolute",
    width: 32,
    height: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.6,
  },
  crosshairLineV: {
    position: "absolute",
    width: 2,
    height: 32,
    backgroundColor: "#FFFFFF",
    opacity: 0.6,
  },
  crosshairDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.3)",
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
  placeButtonContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  placeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  placeButtonText: {
    color: Colors.lightGray,
    fontSize: 16,
    fontWeight: "600",
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
