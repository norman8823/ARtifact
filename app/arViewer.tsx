import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { FontAwesome } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function ARViewerScreen() {
  const params = useLocalSearchParams();
  const artworkId = Array.isArray(params.artworkId)
    ? params.artworkId[0]
    : params.artworkId;
  const artworkTitle = Array.isArray(params.title)
    ? params.title[0]
    : params.title || "Artwork";
  const arImage = Array.isArray(params.arImage)
    ? params.arImage[0]
    : params.arImage;

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Use the arImage from the artwork data, fallback to demo URL if not available
  const arURL = arImage || `https://artifact2.8thwall.app/ruthgleaning/`;

  const handleBack = () => {
    router.back();
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    Alert.alert(
      "AR Error",
      "Unable to load AR experience. Please check your internet connection and try again.",
      [
        { text: "Try Again", onPress: () => setHasError(false) },
        { text: "Go Back", onPress: handleBack },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        {/* Loading Indicator */}
        {isLoading && (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#666" />
            <ThemedText style={styles.loadingText}>
              Loading AR Experience...
            </ThemedText>
          </ThemedView>
        )}

        {/* Error State */}
        {hasError ? (
          <ThemedView style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color="#999" />
            <ThemedText style={styles.errorTitle}>
              AR Experience Unavailable
            </ThemedText>
            <ThemedText style={styles.errorMessage}>
              Unable to load the AR experience. Please check your internet
              connection and try again.
            </ThemedText>
            <Pressable
              style={styles.retryButton}
              onPress={() => setHasError(false)}
            >
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          /* WebView */
          <WebView
            source={{ uri: arURL }}
            style={styles.webview}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleError}
            // Enable camera access for AR
            allowsAirPlayForMediaPlayback={false}
            allowsBackForwardNavigationGestures={false}
            // Security settings
            originWhitelist={["https://*"]}
            mixedContentMode="compatibility"
          />
        )}

        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <FontAwesome name="arrow-left" size={18} color="#fff" />
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
                `Viewing AR content for: ${artworkTitle}\nArtwork ID: ${artworkId}\nAR URL: ${arURL}`,
                [{ text: "OK" }]
              )
            }
          >
            <FontAwesome name="info" size={16} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    color: "#333",
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#666",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  backButtonContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1000,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    ...shadowStyle,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  infoButtonContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    ...shadowStyle,
  },
});
