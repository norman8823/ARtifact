import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { useAuth } from "@/src/hooks/useAuth";
import { useGoBack } from "@/src/hooks/useGoBack";
import { FontAwesome } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

export default function EmailLoginScreen() {
  const goBack = useGoBack();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [needsResetCode, setNeedsResetCode] = useState(false);

  const {
    signUpWithEmail,
    confirmEmailSignUp,
    signInWithEmail,
    signOut,
    requestPasswordReset,
    confirmPasswordReset,
    isLoading,
    error,
    getStoredPassword,
    clearTempCredentials,
  } = useAuth();
  const { refreshAuth } = useAuthContext();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPassword = (password: string) => {
    return password.length >= 8;
  };

  const isValidUsername = (username: string) => {
    // Only allow numbers and English letters, 3-20 characters
    return /^[a-zA-Z0-9]{3,20}$/.test(username);
  };

  const handleSubmit = async () => {
    try {
      // Handle password reset flow
      if (isForgotPassword) {
        if (needsResetCode) {
          // Confirm password reset with code and new password
          const result = await confirmPasswordReset(
            email,
            resetCode,
            newPassword
          );
          if (result.isPasswordReset) {
            Alert.alert(
              "Password Reset Successful",
              "Your password has been reset. Please sign in with your new password.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    // Reset all forgot password states and return to sign in
                    setIsForgotPassword(false);
                    setNeedsResetCode(false);
                    setResetCode("");
                    setNewPassword("");
                    setPassword("");
                  },
                },
              ]
            );
          }
        } else {
          // Request password reset code
          const result = await requestPasswordReset(email);
          if (result.isCodeSent) {
            setNeedsResetCode(true);
            Alert.alert(
              "Reset Code Sent",
              "A password reset code has been sent to your email. Please check your inbox."
            );
          }
        }
        return;
      }

      if (needsVerification) {
        // Step 1: Confirm the sign up
        const confirmResult = await confirmEmailSignUp(email, verificationCode);

        // Step 2: If confirmation is successful, THEN sign in
        if (confirmResult.isSignUpConfirmed) {
          const storedPassword = getStoredPassword();
          const signInResult = await signInWithEmail(email, storedPassword);

          // Clear stored credentials after successful sign in
          clearTempCredentials();

          if (signInResult.isSignedIn) {
            // Refresh auth context to update authentication state
            await refreshAuth();
            router.replace("/home");
          }
        }
        return;
      }

      if (isSignUp) {
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
          username
        );
        if (isVerificationRequired) {
          setNeedsVerification(true);
        }
      } else {
        const signInResult = await signInWithEmail(email, password);
        if (signInResult.isSignedIn) {
          // Refresh auth context to update authentication state
          await refreshAuth();
          router.replace("/home");
        }
      }
    } catch (err: any) {
      // Enhanced error logging
      Sentry.captureException(err, {
        tags: {
          component: "EmailLoginScreen",
          action: isForgotPassword
            ? needsResetCode
              ? "confirmPasswordReset"
              : "requestPasswordReset"
            : needsVerification
            ? "verification"
            : isSignUp
            ? "signUp"
            : "signIn",
        },
        extra: {
          userInput: {
            email,
            hasPassword: !!password,
            hasUsername: !!username,
            hasVerificationCode: !!verificationCode,
            hasResetCode: !!resetCode,
            hasNewPassword: !!newPassword,
          },
          validationState: {
            isValidEmail: isValidEmail(email),
            isValidPassword: isValidPassword(password),
            isValidUsername: username ? isValidUsername(username) : null,
          },
        },
      });

      Alert.alert(
        "Authentication Error",
        err.message || "An error occurred during authentication"
      );
    }
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerTop}>
              <Pressable style={styles.backButton} onPress={goBack}>
                <FontAwesome
                  name="chevron-left"
                  size={20}
                  color={Colors.darkGray}
                />
              </Pressable>
              <ThemedText style={styles.title}>
                {isForgotPassword
                  ? "Reset Password"
                  : needsVerification
                  ? "Verify Email"
                  : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
              </ThemedText>
              <FontAwesome
                style={styles.placeholder}
                name="chevron-right"
                size={20}
                color={Colors.lightGray}
              />
            </ThemedView>
          </ThemedView>

          {/* Main Content */}
          <ThemedView style={styles.mainContent}>
            {/* Instructions */}
            <ThemedView style={styles.instructions}>
              <ThemedText type="title" style={styles.instructionsTitle}>
                {isForgotPassword
                  ? needsResetCode
                    ? "Enter reset code"
                    : "Reset your password"
                  : needsVerification
                  ? "Enter verification code"
                  : isSignUp
                  ? "Create your account"
                  : "Welcome back"}
              </ThemedText>
              <ThemedText style={styles.instructionsText}>
                {isForgotPassword
                  ? needsResetCode
                    ? "Please enter the reset code sent to your email and choose a new password."
                    : "Enter your email address and we'll send you a code to reset your password."
                  : needsVerification
                  ? "Please enter the verification code sent to your email."
                  : isSignUp
                  ? "Please enter your details to create an account."
                  : "Please enter your email and password to sign in."}
              </ThemedText>
            </ThemedView>

            {/* Form */}
            <ThemedView style={styles.formContainer}>
              {/* Forgot Password Flow */}
              {isForgotPassword && (
                <>
                  {!needsResetCode && (
                    <ThemedView style={styles.emailInputContainer}>
                      <ThemedView style={styles.emailInputWrapper}>
                        <FontAwesome
                          name="envelope"
                          size={20}
                          color={Colors.darkMedGray}
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
                  )}

                  {needsResetCode && (
                    <>
                      <ThemedView style={styles.emailInputContainer}>
                        <ThemedView style={styles.emailInputWrapper}>
                          <FontAwesome
                            name="key"
                            size={20}
                            color={Colors.darkMedGray}
                            style={styles.emailIcon}
                          />
                          <TextInput
                            style={styles.emailInput}
                            placeholder="Reset code"
                            keyboardType="number-pad"
                            value={resetCode}
                            onChangeText={setResetCode}
                          />
                        </ThemedView>
                      </ThemedView>

                      <ThemedView style={styles.emailInputContainer}>
                        <ThemedView style={styles.emailInputWrapper}>
                          <FontAwesome
                            name="lock"
                            size={20}
                            color={Colors.darkMedGray}
                            style={styles.emailIcon}
                          />
                          <TextInput
                            style={styles.emailInput}
                            placeholder="New password (min 8 characters)"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                          />
                        </ThemedView>
                      </ThemedView>
                    </>
                  )}
                </>
              )}

              {/* Regular Sign In/Sign Up Flow */}
              {!isForgotPassword && !needsVerification && (
                <>
                  <ThemedView style={styles.emailInputContainer}>
                    <ThemedView style={styles.emailInputWrapper}>
                      <FontAwesome
                        name="envelope"
                        size={20}
                        color={Colors.darkMedGray}
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
                            color={Colors.darkMedGray}
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
                    </>
                  )}

                  <ThemedView style={styles.emailInputContainer}>
                    <ThemedView style={styles.emailInputWrapper}>
                      <FontAwesome
                        name="lock"
                        size={20}
                        color={Colors.darkMedGray}
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

              {/* Verification Code */}
              {!isForgotPassword && needsVerification && (
                <ThemedView style={styles.emailInputContainer}>
                  <ThemedView style={styles.emailInputWrapper}>
                    <FontAwesome
                      name="key"
                      size={20}
                      color={Colors.darkMedGray}
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
                style={({ pressed }) => [
                  styles.sendCodeButton,
                  (isForgotPassword
                    ? needsResetCode
                      ? !resetCode ||
                        !newPassword ||
                        !isValidPassword(newPassword)
                      : !email || !isValidEmail(email)
                    : !email ||
                      !isValidEmail(email) ||
                      (!needsVerification && !isValidPassword(password)) ||
                      (isSignUp &&
                        !needsVerification &&
                        !isValidUsername(username))) &&
                    styles.sendCodeButtonDisabled,
                  pressed && !isLoading && styles.sendCodeButtonPressed,
                ]}
                disabled={
                  isLoading ||
                  (isForgotPassword
                    ? needsResetCode
                      ? !resetCode ||
                        !newPassword ||
                        !isValidPassword(newPassword)
                      : !email || !isValidEmail(email)
                    : !email ||
                      !isValidEmail(email) ||
                      (!needsVerification && !isValidPassword(password)) ||
                      (isSignUp &&
                        !needsVerification &&
                        !isValidUsername(username)))
                }
                onPress={handleSubmit}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.lightGray} />
                ) : (
                  <ThemedText style={styles.sendCodeButtonText}>
                    {isForgotPassword
                      ? needsResetCode
                        ? "Reset Password"
                        : "Send Reset Code"
                      : needsVerification
                      ? "Verify Email"
                      : isSignUp
                      ? "Sign Up"
                      : "Sign In"}
                  </ThemedText>
                )}
              </Pressable>

              {/* Forgot Password Link */}
              {!needsVerification && !isSignUp && !isForgotPassword && (
                <Pressable
                  style={styles.forgotPasswordLink}
                  onPress={() => {
                    setIsForgotPassword(true);
                    setPassword("");
                  }}
                >
                  <ThemedText
                    style={[
                      { color: Colors.metRed },
                      styles.forgotPasswordText,
                    ]}
                  >
                    Forgot password?
                  </ThemedText>
                </Pressable>
              )}

              {/* Back to Sign In Link */}
              {isForgotPassword && (
                <Pressable
                  style={styles.toggleAuthMode}
                  onPress={() => {
                    setIsForgotPassword(false);
                    setNeedsResetCode(false);
                    setResetCode("");
                    setNewPassword("");
                  }}
                >
                  <ThemedText
                    style={[
                      { color: Colors.darkMedGray },
                      styles.toggleAuthModeText,
                    ]}
                  >
                    Remember your password?{" "}
                  </ThemedText>
                  <ThemedText
                    style={[
                      { color: Colors.metRed },
                      styles.toggleAuthModeText,
                    ]}
                  >
                    Sign in
                  </ThemedText>
                </Pressable>
              )}

              {/* Toggle Sign Up / Sign In */}
              {!needsVerification && !isForgotPassword && (
                <Pressable
                  style={styles.toggleAuthMode}
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setUsername("");
                  }}
                >
                  <ThemedText
                    style={[
                      { color: Colors.darkMedGray },
                      styles.toggleAuthModeText,
                    ]}
                  >
                    {isSignUp
                      ? "Already have an account? "
                      : "Don't have an account? "}
                  </ThemedText>
                  <ThemedText
                    style={[
                      { color: Colors.metRed },
                      styles.toggleAuthModeText,
                    ]}
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 36,
  },
  backButton: {
    paddingVertical: 10,
    paddingRight: 10,
  },
  placeholder: {},
  title: {
    fontSize: 20,
    marginLeft: -10,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionsTitle: {
    marginBottom: 16,
  },
  instructions: {
    marginBottom: 20,
  },
  instructionsText: {
    color: Colors.darkMedGray,
  },
  formContainer: {
    marginBottom: 36,
  },
  emailInputContainer: {
    marginBottom: 16,
    borderRadius: 12,
    ...shadowStyle,
  },
  emailInputWrapper: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  emailIcon: {
    marginLeft: 16,
  },
  emailInput: {
    flex: 1,
    padding: 16,
  },
  sendCodeButton: {
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: "center",
    ...shadowStyle,
  },
  sendCodeButtonDisabled: {
    backgroundColor: Colors.medGray,
  },
  sendCodeButtonPressed: {
    backgroundColor: Colors.metRed,
    shadowOpacity: 0,
    elevation: 0,
    transform: [{ translateY: 1 }],
  },
  sendCodeButtonText: {
    color: Colors.lightGray,
  },
  toggleAuthMode: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  toggleAuthModeText: {
    fontSize: 14,
  },
  forgotPasswordLink: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordText: {
    fontSize: 14,
  },
});
