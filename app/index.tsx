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
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFEF9" }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
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
                style={styles.backgroundImage}
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

            {/* Login Options */}
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

              {/* <ThemedView style={styles.divider}>
                <ThemedView style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>or</ThemedText>
                <ThemedView style={styles.dividerLine} />
              </ThemedView> */}

              {/* <Pressable
                style={styles.socialButton}
                onPress={() => router.push("/googleLogin")}
              >
                <FontAwesome
                  name="google"
                  size={20}
                  color={Colors.darkMedGray}
                  style={styles.buttonIcon}
                />
                <ThemedText style={styles.buttonText}>
                  Continue with Google
                </ThemedText>
              </Pressable> */}

              {/* <Pressable
                style={styles.socialButton}
                onPress={() => router.push("/appleLogin")}
              >
                <FontAwesome
                  name="apple"
                  size={20}
                  color={Colors.darkMedGray}
                  style={styles.buttonIcon}
                />
                <ThemedText style={styles.buttonText}>
                  Continue with Apple
                </ThemedText>
              </Pressable> */}
            </ThemedView>
          </ThemedView>

          {/* Footer */}
          {/* <ThemedView style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Don't have an account?{" "}
              <ThemedText style={styles.signUpText}>Sign up</ThemedText>
            </ThemedText>
          </ThemedView> */}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFEF9",
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    marginBottom: 24,
  },
  logo: {
    width: "100%",
    height: 80,
    maxWidth: 400,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundImage: {
    width: "85%",
    aspectRatio: 1,
  },
  welcomeSection: {
    marginBottom: 36,
  },
  welcomeTitle: {
    marginBottom: 12,
  },
  welcomeText: {
    color: Colors.darkMedGray,
  },
  loginOptions: {
    marginBottom: 16,
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
