import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const SCREEN_WIDTH = Dimensions.get("window").width;

export type AuthPromptContext = "quest" | "ar" | "scan" | "profile" | "favorite";

interface AuthPromptModalProps {
  visible: boolean;
  onClose: () => void;
  context: AuthPromptContext;
}

const contextMessages: Record<AuthPromptContext, string> = {
  quest: "Sign in to view Quests",
  ar: "Sign in to use AR features",
  scan: "Sign in to scan artwork",
  profile: "Sign in to view your profile",
  favorite: "Sign in to save favorites",
};

export function AuthPromptModal({
  visible,
  onClose,
  context,
}: AuthPromptModalProps) {
  const handleSignIn = () => {
    onClose();
    router.push("/");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="light" style={styles.modal}>
          <View style={styles.content}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <FontAwesome name="lock" size={24} color={Colors.darkMedGray} />
              </View>

            {/* Message */}
            <ThemedText type="subtitle" style={styles.message}>
              {contextMessages[context]}
            </ThemedText>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                ]}
                onPress={onClose}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.signInButton,
                  pressed && styles.signInButtonPressed,
                ]}
                onPress={handleSignIn}
              >
                {({ pressed }) => (
                  <ThemedText style={[
                    styles.signInButtonText,
                    pressed && styles.signInButtonTextPressed,
                  ]}>
                    Sign In
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: SCREEN_WIDTH - 60,
    borderRadius: 24,
    overflow: "hidden",
  },
  content: {
    padding: 28,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  iconContainer: {
    marginBottom: 16,
  },
  message: {
    textAlign: "center",
    marginBottom: 24,
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.darkMedGray,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  cancelButtonPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  cancelButtonText: {
    color: Colors.darkMedGray,
    fontSize: 16,
  },
  signInButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.darkGray,
    alignItems: "center",
  },
  signInButtonPressed: {
    backgroundColor: Colors.metRed,
  },
  signInButtonText: {
    color: Colors.lightGray,
    fontSize: 16,
  },
  signInButtonTextPressed: {
    color: Colors.lightGray,
  },
});
