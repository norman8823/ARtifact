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
  SafeAreaView,
} from "react-native";
import "../src/aws/config";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";

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
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerTop}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <FontAwesome
                  name="chevron-left"
                  size={20}
                  color={Colors.darkGray}
                />
              </Pressable>
              <ThemedText style={styles.title}>
                {needsVerification
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
                {needsVerification
                  ? "Enter verification code"
                  : isSignUp
                  ? "Create your account"
                  : "Welcome back!"}
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

                      <ThemedView style={styles.emailInputContainer}>
                        <ThemedView style={styles.emailInputWrapper}>
                          <FontAwesome
                            name="phone"
                            size={20}
                            color={Colors.darkMedGray}
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

              {needsVerification && (
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
                  <ActivityIndicator color={Colors.lightGray} />
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

            {/* Alternative Options */}
            {/* {!needsVerification && (
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
                    <FontAwesome
                      name="phone"
                      size={24}
                      color={Colors.darkMedGray}
                    />
                    <ThemedText style={styles.alternativeButtonText}>
                      Phone
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={styles.alternativeButton}
                    onPress={() => router.replace("/googleLogin")}
                  >
                    <FontAwesome
                      name="google"
                      size={24}
                      color={Colors.darkMedGray}
                    />
                    <ThemedText style={styles.alternativeButtonText}>
                      Google
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={styles.alternativeButton}
                    onPress={() => router.replace("/appleLogin")}
                  >
                    <FontAwesome
                      name="apple"
                      size={24}
                      color={Colors.darkMedGray}
                    />
                    <ThemedText style={styles.alternativeButtonText}>
                      Apple
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              </ThemedView>
            )} */}
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
  sendCodeButtonText: {
    color: Colors.lightGray,
  },
  // alternativeContainer: {
  //   marginBottom: 80,
  // },
  // dividerContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginBottom: 20,
  // },
  // divider: {
  //   flex: 1,
  //   height: 1,
  //   backgroundColor: Colors.medGray,
  // },
  // dividerText: {
  //   marginHorizontal: 16,
  //   fontSize: 14,
  //   color: Colors.darkMedGray,
  // },
  // alternativeButtons: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  // },
  // alternativeButton: {
  //   backgroundColor: Colors.medLightGray,
  //   flex: 1,
  //   alignItems: "center",
  //   padding: 12,
  //   borderRadius: 12,
  //   marginHorizontal: 4,
  //   ...shadowStyle,
  // },
  // alternativeButtonText: {
  //   fontSize: 12,
  //   marginTop: 4,
  // },
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
});
