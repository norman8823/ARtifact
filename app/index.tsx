import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.logoContainer}>
          <ThemedView style={styles.logoCircle}>
            <FontAwesome name="building" size={24} color="#333" />
          </ThemedView>
        </ThemedView>
        <ThemedText style={styles.appTitle}>ARtifact</ThemedText>
        <ThemedText style={styles.appSubtitle}>
          Your museum companion
        </ThemedText>
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
          <Link href="/home" replace>
            <ThemedText style={styles.welcomeTitle}>Welcome</ThemedText>
          </Link>
          <ThemedText style={styles.welcomeText}>
            Discover art collections, view your favorite artworks with Augmented
            Reality, and go on an ArtQuest at the MET.
          </ThemedText>
        </ThemedView>

        {/* Login Options */}
        <ThemedView style={styles.loginOptions}>
          <Pressable style={styles.loginButton}>
            <ThemedView style={styles.buttonContent}>
              <FontAwesome
                name="phone"
                size={20}
                color="#333"
                style={styles.buttonIcon}
              />
              <ThemedText style={styles.buttonText}>
                Continue with phone
              </ThemedText>
            </ThemedView>
            <FontAwesome name="chevron-right" size={16} color="#999" />
          </Pressable>

          <Pressable style={styles.loginButton}>
            <ThemedView style={styles.buttonContent}>
              <FontAwesome
                name="envelope"
                size={20}
                color="#333"
                style={styles.buttonIcon}
              />
              <ThemedText style={styles.buttonText}>
                Continue with email
              </ThemedText>
            </ThemedView>
            <FontAwesome name="chevron-right" size={16} color="#999" />
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
              color="#333"
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
              color="#333"
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.buttonText}>
              Continue with Apple
            </ThemedText>
          </Pressable>
        </ThemedView>

        {/* Terms & Privacy */}
        <ThemedView style={styles.termsSection}>
          <ThemedText style={styles.termsText}>
            By continuing, you agree to our{" "}
            <ThemedText style={styles.underline}>Terms of Service</ThemedText>{" "}
            and <ThemedText style={styles.underline}>Privacy Policy</ThemedText>
            .
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Footer */}
      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Don't have an account?{" "}
          <ThemedText style={styles.signUpText}>Sign up</ThemedText>
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: "Playfair Display",
  },
  appSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 40,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  imageContainer: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  backgroundImage: {
    width: "100%",
    height: 192,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
    fontFamily: "Playfair Display",
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  loginOptions: {
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 14,
  },
  socialButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  termsSection: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  underline: {
    textDecorationLine: "underline",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
  },
  signUpText: {
    color: "#007AFF",
    fontWeight: "500",
  },
});
