import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/src/hooks/useAuth";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import "../src/aws/config";
import { Colors } from "@/constants/Colors";

export default function EmailLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const {
    signUpWithEmail,
    confirmEmailSignUp,
    signInWithEmail,
    signOut,
    isLoading,
    error,
  } = useAuth();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPassword = (password: string) => {
    return password.length >= 8;
  };

  const isValidPhoneNumber = (phone: string) => {
    // Basic phone number validation - can be made more robust
    return /^\+?[1-9]\d{1,14}$/.test(phone);
  };

  const isValidUsername = (username: string) => {
    // Only allow numbers and English letters, 3-20 characters
    return /^[a-zA-Z0-9]{3,20}$/.test(username);
  };

  const handleSubmit = async () => {
    try {
      if (needsVerification) {
        const signInResult = await confirmEmailSignUp(email, verificationCode);
        if (signInResult.isSignedIn) {
          router.replace("/home");
        }
        return;
      }

      if (isSignUp) {
        if (!isValidPhoneNumber(phoneNumber)) {
          Alert.alert(
            "Invalid Phone Number",
            "Please enter a valid phone number with country code (e.g., +1234567890)"
          );
          return;
        }
        if (!isValidUsername(username)) {
          Alert.alert(
            "Invalid Username",
            "Username must be 3-20 characters long and contain only letters and numbers"
          );
          return;
        }
        const { isVerificationRequired } = await signUpWithEmail(
          email,
          password,
          phoneNumber,
          username
        );
        if (isVerificationRequired) {
          setNeedsVerification(true);
        }
      } else {
        const signInResult = await signInWithEmail(email, password);
        if (signInResult.isSignedIn) {
          router.replace("/home");
        }
      }
    } catch (err: any) {
      Alert.alert(
        "Authentication Error",
        err.message || "An error occurred during authentication"
      );
    }
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
          <ThemedText style={styles.title}>
            {needsVerification
              ? "Verify Email"
              : isSignUp
              ? "Sign Up"
              : "Sign In"}
          </ThemedText>
          <ThemedView style={styles.placeholder} />
        </ThemedView>
      </ThemedView>

      {/* Main Content */}
      <ThemedView style={styles.mainContent}>
        {/* Instructions */}
        <ThemedView style={styles.instructions}>
          <ThemedText style={styles.instructionsTitle}>
            {needsVerification
              ? "Enter verification code"
              : isSignUp
              ? "Create your account"
              : "Welcome back"}
          </ThemedText>
          <ThemedText style={styles.instructionsText}>
            {needsVerification
              ? "Please enter the verification code sent to your email."
              : isSignUp
              ? "Please enter your details to create an account."
              : "Please enter your email and password to sign in."}
          </ThemedText>
        </ThemedView>

        {/* Form */}
        <ThemedView style={styles.formContainer}>
          {!needsVerification && (
            <>
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

              {isSignUp && (
                <>
                  <ThemedView style={styles.emailInputContainer}>
                    <ThemedView style={styles.emailInputWrapper}>
                      <FontAwesome
                        name="user"
                        size={20}
                        color="#666"
                        style={styles.emailIcon}
                      />
                      <TextInput
                        style={styles.emailInput}
                        placeholder="Choose a username"
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                      />
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={styles.emailInputContainer}>
                    <ThemedView style={styles.emailInputWrapper}>
                      <FontAwesome
                        name="phone"
                        size={20}
                        color="#666"
                        style={styles.emailIcon}
                      />
                      <TextInput
                        style={styles.emailInput}
                        placeholder="Phone number (e.g., +1234567890)"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                      />
                    </ThemedView>
                  </ThemedView>
                </>
              )}

              <ThemedView style={styles.emailInputContainer}>
                <ThemedView style={styles.emailInputWrapper}>
                  <FontAwesome
                    name="lock"
                    size={20}
                    color="#666"
                    style={styles.emailIcon}
                  />
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </ThemedView>
              </ThemedView>
            </>
          )}

          {needsVerification && (
            <ThemedView style={styles.emailInputContainer}>
              <ThemedView style={styles.emailInputWrapper}>
                <FontAwesome
                  name="key"
                  size={20}
                  color="#666"
                  style={styles.emailIcon}
                />
                <TextInput
                  style={styles.emailInput}
                  placeholder="Verification code"
                  keyboardType="number-pad"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                />
              </ThemedView>
            </ThemedView>
          )}

          <Pressable
            style={[
              styles.sendCodeButton,
              (!email ||
                !isValidEmail(email) ||
                (!needsVerification && !isValidPassword(password)) ||
                (isSignUp &&
                  !needsVerification &&
                  !isValidPhoneNumber(phoneNumber)) ||
                (isSignUp &&
                  !needsVerification &&
                  !isValidUsername(username))) &&
                styles.sendCodeButtonDisabled,
            ]}
            disabled={
              isLoading ||
              !email ||
              !isValidEmail(email) ||
              (!needsVerification && !isValidPassword(password)) ||
              (isSignUp &&
                !needsVerification &&
                !isValidPhoneNumber(phoneNumber)) ||
              (isSignUp && !needsVerification && !isValidUsername(username))
            }
            onPress={handleSubmit}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.sendCodeButtonText}>
                {needsVerification
                  ? "Verify Email"
                  : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
              </ThemedText>
            )}
          </Pressable>

          {!needsVerification && (
            <Pressable
              style={styles.toggleAuthMode}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setUsername("");
                setPhoneNumber("");
              }}
            >
              <ThemedText style={styles.toggleAuthModeText}>
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </ThemedText>
            </Pressable>
          )}
        </ThemedView>

        {/* Alternative Options */}
        {!needsVerification && (
          <ThemedView style={styles.alternativeContainer}>
            <ThemedView style={styles.dividerContainer}>
              <ThemedView style={styles.divider} />
              <ThemedText style={styles.dividerText}>
                or continue with
              </ThemedText>
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
        )}

        {/* Security Note */}
        <ThemedView style={styles.securityNote}>
          <FontAwesome name="shield" size={20} color="#007AFF" />
          <ThemedText style={styles.securityNoteText}>
            Your information is securely encrypted and protected.
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
  toggleAuthMode: {
    marginTop: 16,
    alignItems: "center",
  },
  toggleAuthModeText: {
    color: "#007AFF",
    fontSize: 14,
  },
});
