import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { getCurrentUser } from "aws-amplify/auth";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";

export default function LandingScreen() {
  const router = useRouter();

  // Check for existing authenticated user
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await getCurrentUser();
        console.log("User already authenticated, redirecting to home");
        router.replace("/home");
      } catch (error) {
        console.log("No authenticated user found");
      }
    };

    checkAuthentication();
  }, []);

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedView style={styles.titleRow}>
              <ThemedText style={[{ color: Colors.metRed }, styles.appTitle]}>
                AR
              </ThemedText>
              <ThemedText style={styles.appTitle}>tifact</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Main Content */}
          <ThemedView style={styles.mainContent}>
            {/* Background Image */}
            <ThemedView style={styles.imageContainer}>
              <Image
                source={{
                  uri: "https://storage.googleapis.com/uxpilot-auth.appspot.com/f0a34ddb90-42e312c324d1f17d7705.png",
                }}
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
                style={styles.loginButton}
                onPress={() => router.push("/phoneLogin")}
              >
                <ThemedView style={styles.buttonContent}>
                  <FontAwesome
                    name="phone"
                    size={20}
                    color={Colors.darkMedGray}
                    style={styles.buttonIcon}
                  />
                  <ThemedText style={styles.buttonText}>
                    Continue with phone
                  </ThemedText>
                </ThemedView>
                <FontAwesome
                  name="chevron-right"
                  size={16}
                  color={Colors.darkMedGray}
                />
              </Pressable>

              <Pressable
                style={styles.loginButton}
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

              <ThemedView style={styles.divider}>
                <ThemedView style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>or</ThemedText>
                <ThemedView style={styles.dividerLine} />
              </ThemedView>

              <Pressable
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
              </Pressable>

              <Pressable
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
              </Pressable>
            </ThemedView>

            {/* Terms & Privacy */}
            {/* <ThemedView style={styles.termsSection}>
              <ThemedText style={styles.termsText}>
                By continuing, you agree to our{" "}
                <ThemedText style={styles.underline}>
                  Terms of Service
                </ThemedText>{" "}
                and{" "}
                <ThemedText style={styles.underline}>Privacy Policy</ThemedText>
                .
              </ThemedText>
            </ThemedView> */}
          </ThemedView>

          {/* Footer */}
          <ThemedView style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Don't have an account?{" "}
              <ThemedText style={styles.signUpText}>Sign up</ThemedText>
            </ThemedText>
          </ThemedView>
        </ScrollView>
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
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 48,
    paddingTop: 48,
    marginBottom: 36,
    fontFamily: "TiltPrism",
    letterSpacing: 5,
    textShadowColor: "rgba(0,0,0,.5)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginBottom: 36,
    borderRadius: 12,
    overflow: "hidden",
  },
  backgroundImage: {
    width: "100%",
    height: 192,
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
  // termsSection: {
  //   marginBottom: 24,
  // },
  // termsText: {
  //   fontSize: 12,
  //   color: Colors.darkMedGray,
  //   textAlign: "center",
  // },
  // underline: {
  //   textDecorationLine: "underline",
  // },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    alignItems: "center",
  },
  footerText: {
    color: Colors.darkMedGray,
  },
  signUpText: {
    color: Colors.metRed,
  },
});
