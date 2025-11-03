import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
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
  const artworkTitle = Array.isArray(params.title)
    ? params.title[0]
    : params.title || "Artwork";
  const arImage = Array.isArray(params.arImage)
    ? params.arImage[0]
    : params.arImage;

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Build AR URL - add https if needed
  const buildARURL = (url: string): string => {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return "https://" + url;
    }
    return url;
  };

  const arURL = arImage ? buildARURL(arImage) : null;

  // Debug logging
  console.log("🎯 AR Viewer - arImage:", arImage);
  console.log("🎯 AR Viewer - final arURL:", arURL);

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
            <ActivityIndicator size="large" color={Colors.darkMedGray} />
            <ThemedText style={styles.loadingText}>
              Loading AR Experience...
            </ThemedText>
            <ThemedText
              style={[styles.loadingText, { fontSize: 12, marginTop: 8 }]}
            >
              You may be asked for camera permissions
            </ThemedText>
          </ThemedView>
        )}

        {/* Error State */}
        {hasError || !arURL ? (
          <ThemedView style={styles.errorContainer}>
            <FontAwesome
              name="exclamation-triangle"
              size={48}
              color={Colors.darkMedGray}
            />
            <ThemedText style={styles.errorTitle}>
              AR Experience Unavailable
            </ThemedText>
            <ThemedText style={styles.errorMessage}>
              {!arURL
                ? "AR experience URL is missing or invalid."
                : "Unable to load the AR experience. Please check your internet connection and try again."}
            </ThemedText>
            <Pressable
              style={styles.retryButton}
              onPress={() => setHasError(false)}
            >
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </Pressable>
          </ThemedView>
        ) : arURL ? (
          /* WebView - Let 8th Wall handle camera permissions internally */
          <WebView
            source={{ uri: arURL }}
            style={styles.webview}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            cacheEnabled={true}
            startInLoadingState={true}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleError}
            // AR optimizations
            allowsAirPlayForMediaPlayback={false}
            allowsBackForwardNavigationGestures={false}
            // Security settings
            originWhitelist={["https://*"]}
            mixedContentMode="compatibility"
            // Optimize camera permission handling
            injectedJavaScript={`
              console.log('🎯 AR Viewer: WebView initialized');
              
              // Track if we've already requested camera permissions
              window.cameraPermissionRequested = false;
              
              // Wrap getUserMedia to prevent multiple permission requests
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
                
                navigator.mediaDevices.getUserMedia = function(constraints) {
                  if (window.cameraPermissionRequested) {
                    console.log('🎯 Camera permission already requested, reusing...');
                  } else {
                    console.log('🎯 Requesting camera permissions for the first time');
                    window.cameraPermissionRequested = true;
                  }
                  return originalGetUserMedia(constraints);
                };
              }
              
              true;
            `}
          />
        ) : null}
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
                [{ text: "OK" }]
              )
            }
          >
            <FontAwesome name="info" size={16} color={Colors.lightGray} />
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    gap: 16,
    zIndex: 2000,
  },
  loadingText: {
    color: Colors.darkMedGray,
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
