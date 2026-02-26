import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect, useMemo } from "react";
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
  const [retryCount, setRetryCount] = useState(0);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'retrying' | 'failed'>('loading');
  const [arReady, setArReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const MAX_RETRIES = 2;
  const LOAD_TIMEOUT = 5000;

  // Cleanup on unmount to release camera/WebGL resources
  useEffect(() => {
    return () => {
      console.log("🧹 AR Viewer: Cleaning up WebView resources");
      if (webViewRef.current) {
        // Inject cleanup script to stop camera and release WebGL
        webViewRef.current.injectJavaScript(`
          (function() {
            // Stop all media tracks (camera)
            if (window.stream) {
              window.stream.getTracks().forEach(track => track.stop());
            }
            // Try to stop any getUserMedia streams
            navigator.mediaDevices?.getUserMedia({ video: true })
              .then(stream => stream.getTracks().forEach(track => track.stop()))
              .catch(() => {});
            // Clear any WebGL contexts
            document.querySelectorAll('canvas').forEach(canvas => {
              const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
              if (gl && gl.getExtension) {
                const ext = gl.getExtension('WEBGL_lose_context');
                if (ext) ext.loseContext();
              }
            });
            console.log('🧹 AR cleanup complete');
          })();
          true;
        `);
      }
    };
  }, []);

  // Reset state when artwork changes
  useEffect(() => {
    setRetryCount(0);
    setLoadStatus('loading');
    setArReady(false);
  }, [arImage]);

  // Auto-retry on timeout - based on arReady, not isLoading
  useEffect(() => {
    if (arReady) return; // AR is working, no retry needed

    const timeout = setTimeout(() => {
      if (!arReady && retryCount < MAX_RETRIES) {
        console.log(`🔄 AR timeout - retry ${retryCount + 1}/${MAX_RETRIES}`);
        setLoadStatus('retrying');
        setRetryCount(prev => prev + 1);
      } else if (!arReady && retryCount >= MAX_RETRIES) {
        console.log('❌ AR failed after all retries');
        setLoadStatus('failed');
        setIsLoading(false);
        setHasError(true);
      }
    }, LOAD_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [arReady, retryCount]);

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

  // Cache-bust URL with timestamp (recalculates on arURL or retryCount change)
  const arURLWithCacheBust = useMemo(() => {
    if (!arURL) return null;
    const separator = arURL.includes("?") ? "&" : "?";
    return `${arURL}${separator}_t=${Date.now()}`;
  }, [arURL, retryCount]);

  // Unique key to force WebView remount between different AR experiences or retries
  const webViewKey = arURLWithCacheBust
    ? `ar-webview-${arURLWithCacheBust}-${retryCount}`
    : "ar-webview-empty";

  // Debug logging
  console.log("🎯 AR Viewer - arImage:", arImage);
  console.log("🎯 AR Viewer - final arURL:", arURLWithCacheBust);

  const handleBack = () => {
    router.back();
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    // HTML loaded, but don't stop spinner - wait for 8th Wall to signal ready
    console.log('📄 AR WebView HTML loaded, waiting for 8th Wall...');
  };

  const handleError = () => {
    // Let auto-retry handle it if we haven't exhausted retries
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 AR error - will retry (${retryCount + 1}/${MAX_RETRIES})`);
      setLoadStatus('retrying');
      setRetryCount(prev => prev + 1);
    } else {
      setIsLoading(false);
      setHasError(true);
      setLoadStatus('failed');
    }
  };

  const handleManualRetry = () => {
    setRetryCount(0);
    setLoadStatus('loading');
    setHasError(false);
    setIsLoading(true);
    setArReady(false);
  };

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'ar-ready') {
        console.log('✅ 8th Wall AR is ready!');
        setArReady(true);
        setIsLoading(false);
        setLoadStatus('loading');
      } else if (message.type === 'ar-timeout') {
        console.log('⏱️ 8th Wall detection timed out');
        // Let the retry logic handle it
      }
    } catch (e) {
      // Not a JSON message, ignore
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
        {/* Loading Indicator */}
        {isLoading && (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.darkMedGray} />
            <ThemedText style={styles.loadingText}>
              {loadStatus === 'retrying'
                ? `Retrying... (${retryCount}/${MAX_RETRIES})`
                : 'Loading AR Experience...'}
            </ThemedText>
            <ThemedText
              style={[styles.loadingText, { fontSize: 12, marginTop: 8 }]}
            >
              You may be asked for camera permissions
            </ThemedText>
          </ThemedView>
        )}

        {/* Error State - only show after all retries exhausted */}
        {(loadStatus === 'failed' || !arURLWithCacheBust) ? (
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
              {!arURLWithCacheBust
                ? "AR experience URL is missing or invalid."
                : "Unable to load the AR experience. Please check your internet connection and try again."}
            </ThemedText>
            <Pressable
              style={styles.retryButton}
              onPress={handleManualRetry}
            >
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </Pressable>
          </ThemedView>
        ) : arURLWithCacheBust ? (
          /* WebView - Let 8th Wall handle camera permissions internally */
          <WebView
            ref={webViewRef}
            key={webViewKey}
            source={{ uri: arURLWithCacheBust }}
            style={styles.webview}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            // cacheEnabled={false}
            // incognito={true}
            startInLoadingState={true}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleError}
            onMessage={handleWebViewMessage}
            // AR optimizations
            allowsAirPlayForMediaPlayback={false}
            allowsBackForwardNavigationGestures={false}
            // Security settings
            originWhitelist={["https://*"]}
            mixedContentMode="compatibility"
            // Detect when 8th Wall AR is actually ready
            injectedJavaScript={`
              (function() {
                console.log('🎯 AR Viewer: WebView initialized, checking for 8th Wall...');

                let checkCount = 0;
                const checkReady = setInterval(() => {
                  checkCount++;
                  // 8th Wall sets XR8.isPaused() to false when camera is running
                  if (window.XR8 && typeof window.XR8.isPaused === 'function' && !window.XR8.isPaused()) {
                    console.log('✅ 8th Wall XR8 is running!');
                    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ar-ready'}));
                    clearInterval(checkReady);
                  }
                  // Timeout after 5 seconds (50 * 100ms)
                  if (checkCount > 50) {
                    console.log('⏱️ 8th Wall detection timed out');
                    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ar-timeout'}));
                    clearInterval(checkReady);
                  }
                }, 100);
              })();
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
        {/* Reload Button - always visible when WebView is showing */}
        {arURLWithCacheBust && loadStatus !== 'failed' && (
          <View style={styles.reloadButtonContainer}>
            <Pressable
              style={styles.reloadButton}
              onPress={() => {
                console.log('🔄 Manual reload triggered');
                setRetryCount(prev => prev + 1);
                setArReady(false);
                setIsLoading(true);
                setLoadStatus('loading');
              }}
            >
              <FontAwesome name="refresh" size={14} color="white" />
              <ThemedText style={styles.reloadButtonText}>Reload</ThemedText>
            </Pressable>
          </View>
        )}
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
  reloadButtonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  reloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  reloadButtonText: {
    color: "white",
    fontSize: 14,
  },
});
