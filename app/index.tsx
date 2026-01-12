import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthReady, isAuthenticated } = useAuthContext();

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (!isAuthReady) return; // Wait for auth initialization

    if (isAuthenticated) {
      console.log("✅ User already authenticated, redirecting to home");
      router.replace("/home");
    } else {
      console.log("ℹ️ No authenticated user, showing login options");
    }
  }, [isAuthReady, isAuthenticated, router]);

  // Show loading screen while auth is initializing
  if (!isAuthReady) {
    return (
      <View style={styles.outerContainer}>
        <SafeAreaView
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={Colors.darkGray} />
          <ThemedText style={{ marginTop: 16, color: Colors.darkMedGray }}>
            Loading...
          </ThemedText>
        </SafeAreaView>
      </View>
    );
  }

  // Calculate responsive image size - smaller on larger screens to fit content
  const { height: screenHeight } = Dimensions.get("window");
  const imageSize = Math.min(screenHeight * 0.3, 280);

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/Color logo - no background.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </ThemedView>
        </ThemedView>

        {/* Main Content */}
        <ThemedView style={styles.mainContent}>
          {/* Background Image */}
          <ThemedView style={styles.imageContainer}>
            <Image
              source={require("@/assets/images/RuthSpinning.gif")}
              style={[styles.backgroundImage, { width: imageSize, height: imageSize }]}
              contentFit="cover"
            />
          </ThemedView>

          {/* Welcome Text */}
          <ThemedView style={styles.welcomeSection}>
            <ThemedText type="title" style={styles.welcomeTitle}>
              Welcome
            </ThemedText>
            <ThemedText style={styles.welcomeText}>
              Discover art collections, view your favorite artworks with
              Augmented Reality, and go on an ArtQuest at the MET.
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Login Options - pinned to bottom */}
        <ThemedView style={styles.loginOptions}>
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed
            ]}
            onPress={() => router.push("/emailLogin")}
          >
            <ThemedView style={styles.buttonContent}>
              <FontAwesome
                name="envelope"
                size={20}
                color={Colors.darkMedGray}
                style={styles.buttonIcon}
              />
              <ThemedText style={styles.buttonText}>
                Continue with email
              </ThemedText>
            </ThemedView>
            <FontAwesome
              name="chevron-right"
              size={16}
              color={Colors.darkMedGray}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.guestButton,
              pressed && styles.loginButtonPressed
            ]}
            onPress={() => router.replace("/home")}
          >
            <ThemedText style={styles.guestButtonText}>
              Browse as Guest
            </ThemedText>
          </Pressable>
        </ThemedView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const BACKGROUND_COLOR = "#FFFEF9";

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    marginBottom: 16,
  },
  logo: {
    width: "100%",
    height: 60,
    maxWidth: 400,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  imageContainer: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BACKGROUND_COLOR,
  },
  backgroundImage: {
    borderRadius: 12,
    backgroundColor: BACKGROUND_COLOR,
  },
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeTitle: {
    marginBottom: 12,
  },
  welcomeText: {
    color: Colors.darkMedGray,
  },
  loginOptions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loginButton: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadowStyle,
  },
  loginButtonPressed: {
    shadowOpacity: 0,
    elevation: 0,
    transform: [{ translateY: 1 }],
  },
  guestButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  guestButtonText: {
    color: Colors.darkMedGray,
    textDecorationLine: "underline",
  },
  buttonContent: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {},
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.medGray,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.darkMedGray,
    fontSize: 14,
  },
  socialButton: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyle,
  },
  // footer: {
  //   paddingHorizontal: 24,
  //   paddingTop: 20,
  //   paddingBottom: 36,
  //   alignItems: "center",
  // },
  // footerText: {
  //   color: Colors.darkMedGray,
  // },
  // signUpText: {
  //   color: Colors.metRed,
  // },
});
