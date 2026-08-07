import { ScanResultModal } from "@/components/ScanResultModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useGoBack } from "@/src/hooks/useGoBack";
import { useScanSuccess } from "@/src/hooks/useScanSuccess";
import { adaptFlaskResponse } from "@/src/utils/scanAdapter";
import { requestPrediction, ScanRequestError } from "@/src/utils/scanClient";
import * as Sentry from "@sentry/react-native";
import { FontAwesome } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScanResultState {
  visible: boolean;
  success: boolean;
  artworkTitle?: string;
  artworkId?: string;
  isNewVisit?: boolean;
  xpAwarded?: number;
  questsUpdated?: {
    title: string;
    isCompleted: boolean;
    progress: string;
  }[];
  wrongArtwork?: boolean;
  expectedArtworkTitle?: string;
}

export default function ScanScreen() {
  const goBack = useGoBack();
  const params = useLocalSearchParams();
  const expectedArtworkId = Array.isArray(params.expectedArtworkId)
    ? params.expectedArtworkId[0]
    : params.expectedArtworkId;
  const expectedArtworkTitle = Array.isArray(params.expectedArtworkTitle)
    ? params.expectedArtworkTitle[0]
    : params.expectedArtworkTitle;

  console.log("📱 Scan Screen - Expected artwork:", {
    id: expectedArtworkId,
    title: expectedArtworkTitle,
  });

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<"back" | "front">("back");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Ref, not state: setState is async, so two rapid shutter taps can both clear
  // a state-based guard and fire concurrent uploads.
  const scanInFlight = useRef(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null); // Renamed from rekognitionResult
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<ScanResultState>({
    visible: false,
    success: false,
  });
  const [pressedButton, setPressedButton] = useState<string | null>(null);

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
      console.log("🔍 Processing scan result:", rekognitionData);

      // Check if we have a successful recognition with labels
      if (
        rekognitionData.success &&
        rekognitionData.labels &&
        rekognitionData.labels.length > 0 &&
        rekognitionData.confidence > 0
      ) {
        const recognizedArtworkId = rekognitionData.labels[0].Name;
        console.log("✅ Artwork identified:", recognizedArtworkId);

        // VALIDATION: If we have an expected artwork, check if it matches
        if (expectedArtworkId) {
          console.log(
            "🎯 Validating against expected artwork:",
            expectedArtworkId
          );

          if (recognizedArtworkId !== expectedArtworkId) {
            console.log(
              "⚠️ Wrong artwork scanned! Recognized:",
              recognizedArtworkId
            );

            // Show "wrong artwork" modal
            setModalState({
              visible: true,
              success: false,
              wrongArtwork: true,
              expectedArtworkTitle:
                expectedArtworkTitle || "the correct artwork",
            });
            return;
          }

          console.log("✅ Correct artwork scanned!");
        }

        // Process the scan success through our hook
        const result = await processScanSuccess(rekognitionData);

        if (result) {
          // Trigger haptic feedback for successful scan
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          // Show success modal with results
          setModalState({
            visible: true,
            success: true,
            artworkTitle: result.artworkTitle,
            artworkId: recognizedArtworkId,
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

  // Analyze the photo with the recognition backend.
  //
  // Network policy (timeout, single retry) lives in
  // `src/utils/scanClient.ts` so it is testable and out of the UI. A retriable
  // failure is almost always Railway's scale-to-zero cold start — the app's
  // only real server cold start.
  const analyzeWithFlask = async (uri: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    Sentry.addBreadcrumb({
      category: "scan",
      level: "info",
      message: "scan: requesting prediction",
    });

    try {
      const flaskResult = await requestPrediction(uri);

      // Transform Flask response to match expected format for useScanSuccess
      const transformedResult = adaptFlaskResponse(flaskResult);

      if (transformedResult.success) {
        console.log(
          "✅ Artwork identified by Flask CNN:",
          flaskResult.prediction
        );
      } else {
        console.log("❌ No confident artwork identification from Flask CNN");
      }

      setAnalysisResult(transformedResult);

      // Process the result through our existing handler
      await handleScanResult(transformedResult);
    } catch (error) {
      console.error("❌ Error analyzing image with Flask:", error);

      // Scan failures were previously invisible outside the device (Gaps #20).
      const scanError =
        error instanceof ScanRequestError ? error : undefined;
      Sentry.captureException(error, {
        tags: { component: "scan", scan_stage: "predict" },
        extra: {
          status: scanError?.status,
          timedOut: scanError?.timedOut ?? false,
        },
      });

      Alert.alert(
        "Scan Failed",
        scanError?.timedOut
          ? "The scanner took too long to respond. It may still be waking up — please try again in a moment."
          : "We couldn't analyze that photo. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* COMMENTED OUT: Old S3/Rekognition approach
  const uploadToS3AndAnalyze = async (uri: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

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
      setAnalysisResult(result);

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
  */

  const takePicture = async () => {
    if (!cameraRef.current || isAnalyzing || isProcessing) return;
    // The state checks above lag a fast double-tap by a render; this ref closes
    // that window so rapid shutter taps cannot fire concurrent uploads.
    if (scanInFlight.current) return;
    scanInFlight.current = true;

    try {
      setIsLoading(true);
      console.log("📸 Taking picture...");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      console.log("📸 Picture taken:", photo.uri);
      // Use new Flask analysis instead of S3/Rekognition
      await analyzeWithFlask(photo.uri);
    } catch (error) {
      console.error("❌ Error taking picture:", error);
      Alert.alert("Camera Error", "Failed to take picture. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
      scanInFlight.current = false;
    }
  };

  const closeModal = () => {
    setModalState((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  // Permission loading state
  if (!permission) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.darkMedGray} />
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
        <FontAwesome name="camera" size={64} color={Colors.darkMedGray} />
        <ThemedText type="title" style={styles.errorTitle}>
          Camera Access Required
        </ThemedText>
        <ThemedText style={styles.errorMessage}>
          Please enable camera permissions in your device settings to scan
          artworks.
        </ThemedText>
        <Pressable
          style={[styles.retryButton, pressedButton === 'retry' && styles.buttonPressed]}
          onPress={getCameraPermissions}
          onPressIn={() => setPressedButton('retry')}
          onPressOut={() => setPressedButton(null)}
        >
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          // Edge-swipe only: the whole surface is a camera preview, and an
          // accidental swipe while framing a shot should not abandon the scan.
          fullScreenGestureEnabled: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        {/* Custom Back Button */}
        <View style={styles.backButtonContainer}>
          <Pressable
            style={[styles.backButton, pressedButton === 'back' && styles.buttonPressed]}
            onPress={goBack}
            onPressIn={() => setPressedButton('back')}
            onPressOut={() => setPressedButton(null)}
          >
            <FontAwesome name="arrow-left" size={18} color={Colors.lightGray} />
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </Pressable>
        </View>
        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={cameraType}>
            {/* Camera Controls Overlay */}
            <View style={styles.cameraOverlay}>
              {/* Center Viewfinder */}
              <View style={styles.viewfinderContainer}>
                {isAnalyzing || isProcessing ? (
                  <View style={styles.statusContainer}>
                    <ActivityIndicator size="small" color={Colors.lightGray} />
                    <ThemedText style={styles.statusText}>
                      {isAnalyzing
                        ? "Analyzing artwork..."
                        : "Processing results..."}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.instructionText}>
                    Position artwork in view
                  </ThemedText>
                )}
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <Pressable
                  style={[
                    styles.captureButton,
                    (isAnalyzing || isLoading || isProcessing) &&
                      styles.captureButtonDisabled,
                    pressedButton === 'capture' && styles.buttonPressed,
                  ]}
                  onPress={takePicture}
                  onPressIn={() => setPressedButton('capture')}
                  onPressOut={() => setPressedButton(null)}
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
      </SafeAreaView>

      {/* Scan Result Modal */}
      <ScanResultModal
        visible={modalState.visible}
        onClose={closeModal}
        success={modalState.success}
        artworkTitle={modalState.artworkTitle}
        artworkId={modalState.artworkId}
        isNewVisit={modalState.isNewVisit}
        xpAwarded={modalState.xpAwarded}
        questsUpdated={modalState.questsUpdated}
        wrongArtwork={modalState.wrongArtwork}
        expectedArtworkTitle={modalState.expectedArtworkTitle}
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
    padding: 20,
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
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.darkMedGray,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
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
  viewfinderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionText: {
    color: Colors.lightGray,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    // padding: 20,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  statusText: {
    color: Colors.lightGray,
    paddingVertical: 8,
    borderRadius: 12,
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
  buttonPressed: {
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: -1, height: -1 },
    shadowColor: '#000',
    elevation: 0,
    transform: [{ translateY: 1 }],
  },
});
