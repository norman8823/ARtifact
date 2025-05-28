import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { useState } from "react";

export default function AppleLoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
          <ThemedText style={styles.title}>Sign in with AppleID</ThemedText>
          <ThemedView style={styles.placeholder} />
        </ThemedView>
      </ThemedView>

      {/* Main Content */}
      <ThemedView style={styles.mainContent}>
        {/* Apple ID Icon */}
        <ThemedView style={styles.appleIconContainer}>
          <FontAwesome name="apple" size={48} color="#000000" />
        </ThemedView>

        {/* Apple ID Form */}
        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.formHeading}>
            <ThemedText style={styles.formSubtitle}>
              Use your Apple ID to continue
            </ThemedText>
          </ThemedView>

          {/* Email Input */}
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Apple ID</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Email or phone number"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </ThemedView>

          {/* Password Input */}
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Password</ThemedText>
            <ThemedView style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
              />
              <Pressable
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <FontAwesome
                  name={showPassword ? "eye-slash" : "eye"}
                  size={20}
                  color="#666"
                />
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* Remember Me */}
          <ThemedView style={styles.rememberMeContainer}>
            <Pressable
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <ThemedView
                style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
              >
                {rememberMe && (
                  <FontAwesome name="check" size={12} color="#FFFFFF" />
                )}
              </ThemedView>
              <ThemedText style={styles.rememberMeText}>Remember me</ThemedText>
            </Pressable>
            <Pressable>
              <ThemedText style={styles.forgotPasswordText}>
                Forgot password?
              </ThemedText>
            </Pressable>
          </ThemedView>

          {/* Sign In Button */}
          <Pressable
            style={styles.signInButton}
            onPress={() => router.push("/home")}
          >
            <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
          </Pressable>
        </ThemedView>

        {/* Biometric Option */}
        <ThemedView style={styles.biometricContainer}>
          <ThemedView style={styles.divider} />
          <ThemedText style={styles.biometricText}>Or sign in with</ThemedText>
          <Pressable style={styles.faceIdButton}>
            <FontAwesome name="user" size={24} color="#333" />
          </Pressable>
          <ThemedText style={styles.faceIdText}>Face ID</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Footer */}
      <ThemedView style={styles.footer}>
        <Pressable
          style={styles.otherSignInButton}
          onPress={() => router.push("/")}
        >
          <ThemedText style={styles.otherSignInText}>
            Use other sign in methods
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.termsText}>
          By continuing, you agree to our{" "}
          <ThemedText style={styles.underline}>Terms of Service</ThemedText> and{" "}
          <ThemedText style={styles.underline}>Privacy Policy</ThemedText>.
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
  appleIconContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  formContainer: {
    marginBottom: 32,
  },
  formHeading: {
    alignItems: "center",
    marginBottom: 24,
  },
  formSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  showPasswordButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  rememberMeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  rememberMeText: {
    fontSize: 14,
    color: "#333",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  signInButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  biometricContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 24,
  },
  biometricText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  faceIdButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  faceIdText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  otherSignInButton: {
    marginBottom: 16,
  },
  otherSignInText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  termsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  underline: {
    textDecorationLine: "underline",
  },
});
