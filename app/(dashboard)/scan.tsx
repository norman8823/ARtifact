import { ScanResultModal } from "@/components/ScanResultModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useScanSuccess } from "@/src/hooks/useScanSuccess";
import { FontAwesome } from "@expo/vector-icons";
import { post } from "aws-amplify/api";
import { uploadData } from "aws-amplify/storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

interface ScanResultState {
  visible: boolean;
  success: boolean;
  artworkTitle?: string;
  isNewVisit?: boolean;
  xpAwarded?: number;
  questsUpdated?: Array<{
    title: string;
    isCompleted: boolean;
    progress: string;
  }>;
}

export default function ScanScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<"back" | "front">("back");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rekognitionResult, setRekognitionResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<ScanResultState>({
    visible: false,
    success: false,
  });

  const { processScanSuccess, isProcessing } = useScanSuccess();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const getCameraPermissions = async () => {
    try {
      const response = await requestPermission();
      return response.granted;
    } catch (error) {
      console.error("Error requesting camera permissions:", error);
      return false;
    }
  };

  const handleScanResult = async (rekognitionData: any) => {
    try {
      console.log("🔍 Processing Rekognition result:", rekognitionData);

      // Check if we have a successful recognition with labels
      if (
        rekognitionData.success &&
        rekognitionData.labels &&
        rekognitionData.labels.length > 0 &&
        rekognitionData.confidence > 0
      ) {
        console.log("✅ Artwork identified, processing success...");

        // Process the scan success through our hook
        const result = await processScanSuccess(rekognitionData);

        if (result) {
          // Show success modal with results
          setModalState({
            visible: true,
            success: true,
            artworkTitle: result.artworkTitle,
            isNewVisit: result.isNewVisit,
            xpAwarded: result.xpAwarded,
            questsUpdated: result.questsUpdated,
          });
        } else {
          // This shouldn't happen if we have labels, but handle it
          setModalState({
            visible: true,
            success: false,
          });
        }
      } else {
        console.log("❌ No artwork identified, showing failure modal");
        // Show failure modal
        setModalState({
          visible: true,
          success: false,
        });
      }
    } catch (error) {
      console.error("❌ Error processing scan result:", error);
      Alert.alert(
        "Processing Error",
        "There was an error processing your scan. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const uploadToS3AndAnalyze = async (uri: string) => {
    setIsAnalyzing(true);
    setRekognitionResult(null);

    try {
      console.log("📸 Starting image analysis...");

      // Generate unique filename
      const fileName = `public/scans/scan-${Date.now()}.jpg`;

      // Read the image file as binary
      const response = await fetch(uri);
      const blob = await response.blob();

      console.log("📤 Uploading to S3...");

      // Upload to S3 using Amplify Storage
      const uploadResult = await uploadData({
        path: fileName,
        data: blob,
        options: {
          contentType: "image/jpeg",
        },
      }).result;

      console.log("✅ Upload successful:", uploadResult.path);

      // Call the rekognition API
      console.log("🔍 Calling Rekognition API...");

      const apiName = "rekognitionApi";

      const rekognitionResponse = await post({
        apiName,
        path: "/rekognition",
        options: {
          body: {
            key: uploadResult.path,
          },
        },
      }).response;

      // Parse the response body
      const result = await rekognitionResponse.body.json();

      console.log("🔍 Rekognition Result:", result);
      setRekognitionResult(result);

      // Process the result through our new handler
      await handleScanResult(result);
    } catch (error) {
      console.error("❌ Error analyzing image:", error);

      Alert.alert(
        "Analysis Error",
        `Failed to analyze image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        [{ text: "OK" }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isAnalyzing || isProcessing) return;

    try {
      setIsLoading(true);
      console.log("📸 Taking picture...");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      console.log("📸 Picture taken:", photo.uri);
      await uploadToS3AndAnalyze(photo.uri);
    } catch (error) {
      console.error("❌ Error taking picture:", error);
      Alert.alert("Camera Error", "Failed to take picture. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType((current: "back" | "front") =>
      current === "back" ? "front" : "back"
    );
  };

  const closeModal = () => {
    setModalState({
      visible: false,
      success: false,
    });
  };

  // Permission loading state
  if (!permission) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.darkGray} />
        <ThemedText style={styles.loadingText}>
          Requesting camera permissions...
        </ThemedText>
      </ThemedView>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <FontAwesome name="camera" size={64} color={Colors.medGray} />
        <ThemedText type="title" style={styles.errorTitle}>
          Camera Access Required
        </ThemedText>
        <ThemedText style={styles.errorMessage}>
          Please enable camera permissions in your device settings to scan
          artworks.
        </ThemedText>
        <Pressable style={styles.retryButton} onPress={getCameraPermissions}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Scan Artwork",
        }}
      />
      <ThemedView style={styles.container}>
        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={cameraType}>
            {/* Camera Controls Overlay */}
            <View style={styles.cameraOverlay}>
              {/* Top Controls */}
              <View style={styles.topControls}>
                <Pressable style={styles.flipButton} onPress={toggleCameraType}>
                  <FontAwesome
                    name="refresh"
                    size={24}
                    color={Colors.lightGray}
                  />
                </Pressable>
              </View>

              {/* Center Viewfinder */}
              <View style={styles.viewfinderContainer}>
                <View style={styles.viewfinder} />
                <ThemedText style={styles.instructionText}>
                  Position artwork within the frame
                </ThemedText>
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <Pressable
                  style={[
                    styles.captureButton,
                    (isAnalyzing || isLoading || isProcessing) &&
                      styles.captureButtonDisabled,
                  ]}
                  onPress={takePicture}
                  disabled={isAnalyzing || isLoading || isProcessing}
                >
                  {isLoading || isAnalyzing || isProcessing ? (
                    <ActivityIndicator size="large" color={Colors.lightGray} />
                  ) : (
                    <FontAwesome
                      name="camera"
                      size={32}
                      color={Colors.lightGray}
                    />
                  )}
                </Pressable>
              </View>
            </View>
          </CameraView>
        </View>

        {/* Analysis Status */}
        {(isAnalyzing || isProcessing) && (
          <ThemedView style={styles.statusContainer}>
            <ActivityIndicator size="small" color={Colors.darkGray} />
            <ThemedText style={styles.statusText}>
              {isAnalyzing ? "Analyzing artwork..." : "Processing results..."}
            </ThemedText>
          </ThemedView>
        )}

        {/* Debug Results Display - Show in development only */}
        {__DEV__ && rekognitionResult && (
          <ScrollView style={styles.resultsContainer}>
            <ThemedText type="subtitle" style={styles.resultsTitle}>
              Debug: Analysis Results
            </ThemedText>
            <ThemedView style={styles.resultBox}>
              <ThemedText style={styles.resultText}>
                {JSON.stringify(rekognitionResult, null, 2)}
              </ThemedText>
            </ThemedView>
          </ScrollView>
        )}
      </ThemedView>

      {/* Scan Result Modal */}
      <ScanResultModal
        visible={modalState.visible}
        onClose={closeModal}
        success={modalState.success}
        artworkTitle={modalState.artworkTitle}
        isNewVisit={modalState.isNewVisit}
        xpAwarded={modalState.xpAwarded}
        questsUpdated={modalState.questsUpdated}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.darkMedGray,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    textAlign: "center",
    color: Colors.darkMedGray,
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.darkGray,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.lightGray,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    paddingTop: 40,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  instructionText: {
    marginTop: 16,
    color: Colors.lightGray,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 20,
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.lightGray,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: Colors.medLightGray,
    gap: 8,
  },
  statusText: {
    color: Colors.darkMedGray,
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: Colors.lightGray,
  },
  resultsTitle: {
    padding: 16,
    paddingBottom: 8,
  },
  resultBox: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: Colors.medLightGray,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: Colors.darkGray,
  },
});
