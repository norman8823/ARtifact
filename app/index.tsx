import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { useAppleSignIn } from "@/src/hooks/useAppleSignIn";
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
  const { signInWithApple, isSigningIn } = useAppleSignIn();

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
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/artifact-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Background Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require("@/assets/images/RuthSpinning.gif")}
              style={[styles.backgroundImage, { width: imageSize, height: imageSize }]}
              contentFit="cover"
            />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <ThemedText type="title" style={styles.welcomeTitle}>
              Welcome
            </ThemedText>
            <ThemedText style={styles.welcomeText}>
              Discover art collections, view your favorite artworks with
              Augmented Reality, and go on an ArtQuest at the MET.
            </ThemedText>
          </View>

          {/* Login Options */}
          <View style={styles.loginOptions}>
          <Pressable
            style={({ pressed }) => [
              styles.appleButton,
              pressed && styles.loginButtonPressed
            ]}
            onPress={signInWithApple}
            disabled={isSigningIn}
          >
            <View style={styles.buttonContent}>
              {isSigningIn ? (
                <ActivityIndicator size="small" color={Colors.lightGray} />
              ) : (
                <>
                  <FontAwesome
                    name="apple"
                    size={20}
                    color={Colors.lightGray}
                    style={styles.buttonIcon}
                  />
                  <ThemedText style={styles.appleButtonText}>
                    Continue with Apple
                  </ThemedText>
                </>
              )}
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed
            ]}
            onPress={() => router.push("/emailLogin")}
          >
            <View style={styles.buttonContent}>
              <FontAwesome
                name="envelope"
                size={20}
                color={Colors.darkMedGray}
                style={styles.buttonIcon}
              />
              <ThemedText style={styles.buttonText}>
                Continue with email
              </ThemedText>
            </View>
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
          </View>
        </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const BACKGROUND_COLOR = "#f9f6f3";

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
  },
  header: {
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    marginBottom: 12,
  },
  logo: {
    width: "100%",
    height: 75,
    maxWidth: 400,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  imageContainer: {
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BACKGROUND_COLOR,
  },
  backgroundImage: {
    borderRadius: 12,
    backgroundColor: BACKGROUND_COLOR,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    marginBottom: 12,
  },
  welcomeText: {
    color: Colors.darkMedGray,
  },
  loginOptions: {
    marginTop: 12,
  },
  // Apple's HIG requires the Sign in with Apple button to be at least as
  // prominent as other sign-in options, so it leads and uses Apple's black
  // treatment. Same geometry as loginButton, minus the trailing chevron.
  appleButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyle,
  },
  appleButtonText: {
    color: Colors.lightGray,
    fontSize: 16,
    fontWeight: "600",
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
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {},
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
