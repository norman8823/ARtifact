import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { useState } from "react";

export default function EmailLoginScreen() {
  const [email, setEmail] = useState("");

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={20} color="#333" />
          </Pressable>
          <ThemedText style={styles.title}>Email Login</ThemedText>
          <ThemedView style={styles.placeholder} />
        </ThemedView>
      </ThemedView>

      {/* Main Content */}
      <ThemedView style={styles.mainContent}>
        {/* Login Instructions */}
        <ThemedView style={styles.instructions}>
          <ThemedText style={styles.instructionsTitle}>
            Enter your email
          </ThemedText>
          <ThemedText style={styles.instructionsText}>
            Please enter your email address to receive a verification code.
          </ThemedText>
        </ThemedView>

        {/* Email Input Form */}
        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.emailInputContainer}>
            <ThemedView style={styles.emailInputWrapper}>
              <FontAwesome
                name="envelope"
                size={20}
                color="#666"
                style={styles.emailIcon}
              />
              <TextInput
                style={styles.emailInput}
                placeholder="Your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </ThemedView>
          </ThemedView>

          <Pressable
            style={[
              styles.sendCodeButton,
              (!email || !isValidEmail(email)) && styles.sendCodeButtonDisabled,
            ]}
            disabled={!email || !isValidEmail(email)}
          >
            <ThemedText style={styles.sendCodeButtonText}>
              Send verification code
            </ThemedText>
          </Pressable>
        </ThemedView>

        {/* Alternative Options */}
        <ThemedView style={styles.alternativeContainer}>
          <ThemedView style={styles.dividerContainer}>
            <ThemedView style={styles.divider} />
            <ThemedText style={styles.dividerText}>or continue with</ThemedText>
            <ThemedView style={styles.divider} />
          </ThemedView>

          <ThemedView style={styles.alternativeButtons}>
            <Pressable
              style={styles.alternativeButton}
              onPress={() => router.replace("/phoneLogin")}
            >
              <FontAwesome name="phone" size={24} color="#333" />
              <ThemedText style={styles.alternativeButtonText}>
                Phone
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.alternativeButton}
              onPress={() => router.replace("/googleLogin")}
            >
              <FontAwesome name="google" size={24} color="#333" />
              <ThemedText style={styles.alternativeButtonText}>
                Google
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.alternativeButton}
              onPress={() => router.replace("/appleLogin")}
            >
              <FontAwesome name="apple" size={24} color="#333" />
              <ThemedText style={styles.alternativeButtonText}>
                Apple
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        {/* Security Note */}
        <ThemedView style={styles.securityNote}>
          <FontAwesome name="shield" size={20} color="#007AFF" />
          <ThemedText style={styles.securityNoteText}>
            Your email is only used for authentication and will never be shared
            with third parties.
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Footer */}
      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Need help?{" "}
          <ThemedText style={styles.supportText}>Contact Support</ThemedText>
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
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Playfair Display",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  instructions: {
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
    fontFamily: "Playfair Display",
  },
  instructionsText: {
    fontSize: 16,
    color: "#666",
  },
  formContainer: {
    marginBottom: 32,
  },
  emailInputContainer: {
    marginBottom: 24,
  },
  emailInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  emailIcon: {
    marginLeft: 16,
  },
  emailInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  sendCodeButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  sendCodeButtonDisabled: {
    opacity: 0.5,
  },
  sendCodeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  alternativeContainer: {
    marginBottom: 32,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#666",
  },
  alternativeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  alternativeButton: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  alternativeButtonText: {
    fontSize: 12,
    marginTop: 4,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    lineHeight: 20,
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
  supportText: {
    color: "#007AFF",
    fontWeight: "500",
  },
});
