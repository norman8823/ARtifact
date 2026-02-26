import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";

export default function ARViewerScreen() {
  const params = useLocalSearchParams();
  const artworkTitle = Array.isArray(params.title)
    ? params.title[0]
    : params.title || "Artwork";
  const arImage = Array.isArray(params.arImage)
    ? params.arImage[0]
    : params.arImage;

  // Build AR URL - add https if needed
  const buildARURL = (url: string): string => {
    if (!url) return "";
    let finalURL = url;
    if (!finalURL.startsWith("http://") && !finalURL.startsWith("https://")) {
      finalURL = "https://" + finalURL;
    }
    return finalURL;
  };

  const arURL = arImage ? buildARURL(arImage) : null;

  // Debug logging
  console.log("🎯 AR Viewer - arImage:", arImage);
  console.log("🎯 AR Viewer - final arURL:", arURL);

  const handleBack = () => {
    router.back();
  };

  const handleOpenAR = async () => {
    if (!arURL) return;

    // Add cache-busting timestamp
    const separator = arURL.includes("?") ? "&" : "?";
    const urlWithCacheBust = `${arURL}${separator}_t=${Date.now()}`;

    console.log("🚀 Opening AR in Safari:", urlWithCacheBust);

    try {
      const supported = await Linking.canOpenURL(urlWithCacheBust);
      if (supported) {
        await Linking.openURL(urlWithCacheBust);
      } else {
        Alert.alert("Error", "Unable to open AR experience URL.");
      }
    } catch (error) {
      console.error("Error opening AR URL:", error);
      Alert.alert("Error", "Failed to open AR experience.");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        {!arURL ? (
          /* Error State - no URL */
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
              AR experience URL is missing or invalid.
            </ThemedText>
          </ThemedView>
        ) : (
          /* Main content - View in AR button */
          <ThemedView style={styles.contentContainer}>
            <FontAwesome name="cube" size={64} color={Colors.darkMedGray} />
            <ThemedText style={styles.title}>{artworkTitle}</ThemedText>
            <ThemedText style={styles.subtitle}>
              Tap below to view this artwork in augmented reality
            </ThemedText>
            <Pressable style={styles.arButton} onPress={handleOpenAR}>
              <FontAwesome name="camera" size={20} color="white" />
              <ThemedText style={styles.arButtonText}>View in AR</ThemedText>
            </Pressable>
            <ThemedText style={styles.hint}>
              Opens in Safari. Tap back to return to the app.
            </ThemedText>
          </ThemedView>
        )}

        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <FontAwesome name="arrow-left" size={18} color={Colors.lightGray} />
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
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
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.darkMedGray,
    textAlign: "center",
    marginBottom: 8,
  },
  arButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.darkMedGray,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 12,
    marginTop: 16,
  },
  arButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: Colors.darkMedGray,
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
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
});
