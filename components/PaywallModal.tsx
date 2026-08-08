import { Colors } from "@/constants/Colors";
import { PREMIUM_PRICE_FALLBACK } from "@/src/iap/products";
import { FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";

const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * Deliberately a separate union from AuthPromptContext: the two modals answer
 * different questions, and AuthPromptModal's primary button hardcodes a push
 * to "/". Guests never reach this modal — they are blocked from quests by the
 * auth prompt first, so anyone seeing a paywall is already signed in.
 */
export type PaywallContext = "quest-start" | "quest-locked";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  context: PaywallContext;
  questTitle?: string;
  /** Localized price from the store; falls back when the store didn't answer. */
  priceLabel: string | null;
  isPurchasing: boolean;
  isRestoring: boolean;
  /** False when the store is unreachable — the CTA says so instead of failing. */
  canPurchase: boolean;
  onUnlock: () => void;
  onRestore: () => void;
}

export function PaywallModal({
  visible,
  onClose,
  context,
  questTitle,
  priceLabel,
  isPurchasing,
  isRestoring,
  canPurchase,
  onUnlock,
  onRestore,
}: PaywallModalProps) {
  const price = priceLabel ?? PREMIUM_PRICE_FALLBACK;
  const busy = isPurchasing || isRestoring;

  const headline =
    context === "quest-start" && questTitle
      ? `Unlock "${questTitle}"`
      : "Unlock All Quests";

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
              <FontAwesome name="unlock" size={24} color={Colors.darkYellow} />
            </View>

            {/* Message */}
            <ThemedText type="subtitle" style={styles.message}>
              {headline}
            </ThemedText>
            <ThemedText style={styles.subMessage}>
              {/* "one-time purchase" already rules out a subscription, and
                  "forever" is a promise about the app's lifetime that we are
                  not in a position to make. */}
              A one-time purchase unlocks every Art Quest.
            </ThemedText>

            {/* Primary CTA */}
            <Pressable
              style={({ pressed }) => [
                styles.unlockButton,
                pressed && styles.unlockButtonPressed,
                (busy || !canPurchase) && styles.unlockButtonDisabled,
              ]}
              onPress={onUnlock}
              disabled={busy || !canPurchase}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color={Colors.lightGray} />
              ) : (
                <ThemedText style={styles.unlockButtonText}>
                  {canPurchase
                    ? `Unlock All Quests · ${price}`
                    : "App Store unavailable"}
                </ThemedText>
              )}
            </Pressable>

            {/* Secondary actions */}
            <View style={styles.secondaryRow}>
              <Pressable onPress={onRestore} disabled={busy} hitSlop={8}>
                {isRestoring ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.darkMedGray}
                  />
                ) : (
                  <ThemedText style={styles.restoreText}>
                    Restore purchase
                  </ThemedText>
                )}
              </Pressable>
              <Pressable onPress={onClose} disabled={busy} hitSlop={8}>
                <ThemedText style={styles.notNowText}>Not now</ThemedText>
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
    marginBottom: 8,
    fontSize: 18,
  },
  subMessage: {
    textAlign: "center",
    marginBottom: 24,
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  unlockButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.darkGray,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  unlockButtonPressed: {
    backgroundColor: Colors.metRed,
  },
  unlockButtonDisabled: {
    opacity: 0.6,
  },
  unlockButtonText: {
    color: Colors.lightGray,
    fontSize: 16,
  },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 16,
  },
  restoreText: {
    color: Colors.darkMedGray,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  notNowText: {
    color: Colors.darkMedGray,
    fontSize: 14,
  },
});
