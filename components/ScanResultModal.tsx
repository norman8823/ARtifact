import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface QuestUpdate {
  title: string;
  isCompleted: boolean;
  progress: string;
}

interface ScanResultModalProps {
  visible: boolean;
  onClose: () => void;
  success: boolean;
  artworkTitle?: string;
  isNewVisit?: boolean;
  xpAwarded?: number;
  questsUpdated?: QuestUpdate[];
}

export function ScanResultModal({
  visible,
  onClose,
  success,
  artworkTitle,
  isNewVisit,
  xpAwarded,
  questsUpdated = [],
}: ScanResultModalProps) {
  const renderSuccessContent = () => (
    <>
      {/* Success Icon */}
      <ThemedView style={styles.iconContainer}>
        <FontAwesome name="check-circle" size={64} color={Colors.darkGreen} />
      </ThemedView>

      {/* Title */}
      <ThemedText type="title" style={styles.title}>
        Artwork Found!
      </ThemedText>

      {/* Artwork Title */}
      <ThemedText type="subtitle" style={styles.artworkTitle}>
        {artworkTitle}
      </ThemedText>

      {/* Visit Status */}
      {isNewVisit ? (
        <ThemedView style={styles.statusContainer}>
          <ThemedView style={styles.newVisitBadge}>
            <FontAwesome name="star" size={16} color={Colors.darkYellow} />
            <ThemedText style={styles.newVisitText}>First Visit!</ThemedText>
          </ThemedView>
          {xpAwarded && xpAwarded > 0 && (
            <ThemedView style={styles.xpBadge}>
              <FontAwesome name="trophy" size={16} color={Colors.darkGreen} />
              <ThemedText style={styles.xpText}>+{xpAwarded} XP</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      ) : (
        <ThemedView style={styles.statusContainer}>
          <ThemedView style={styles.revisitBadge}>
            <FontAwesome name="check" size={16} color={Colors.darkMedGray} />
            <ThemedText style={styles.revisitText}>Already Visited</ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      {/* Quest Updates */}
      {questsUpdated.length > 0 && (
        <ThemedView style={styles.questsSection}>
          <ThemedText type="subtitle" style={styles.questsTitle}>
            Quest Progress
          </ThemedText>
          {questsUpdated.map((quest, index) => (
            <ThemedView key={index} style={styles.questItem}>
              <ThemedView style={styles.questHeader}>
                <FontAwesome
                  name={quest.isCompleted ? "trophy" : "map"}
                  size={16}
                  color={
                    quest.isCompleted ? Colors.darkYellow : Colors.darkMedGray
                  }
                />
                <ThemedText style={styles.questTitle}>{quest.title}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.questProgress}>
                <ThemedText style={styles.questProgressText}>
                  {quest.progress} artworks discovered
                </ThemedText>
                {quest.isCompleted && (
                  <ThemedView style={styles.completedBadge}>
                    <ThemedText style={styles.completedText}>
                      Completed!
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      {/* Action Button */}
      <Pressable style={styles.actionButton} onPress={onClose}>
        <ThemedText style={styles.actionButtonText}>Continue</ThemedText>
      </Pressable>
    </>
  );

  const renderFailureContent = () => (
    <>
      {/* Failure Icon */}
      <ThemedView style={styles.iconContainer}>
        <FontAwesome name="search" size={64} color={Colors.darkMedGray} />
      </ThemedView>

      {/* Title */}
      <ThemedText type="title" style={styles.title}>
        No Match Found
      </ThemedText>

      {/* Message */}
      <ThemedText style={styles.failureMessage}>
        We couldn't identify this artwork. Try getting closer or adjusting the
        angle for a better view.
      </ThemedText>

      {/* Tips */}
      <ThemedView style={styles.tipsContainer}>
        <ThemedText style={styles.tipsTitle}>
          Tips for better scanning:
        </ThemedText>
        <ThemedView style={styles.tipItem}>
          <View style={styles.tipIconContainer}>
            <FontAwesome
              name="lightbulb-o"
              size={14}
              color={Colors.darkMedGray}
            />
          </View>
          <ThemedText style={styles.tipText}>Ensure good lighting</ThemedText>
        </ThemedView>
        <ThemedView style={styles.tipItem}>
          <View style={styles.tipIconContainer}>
            <FontAwesome name="eye" size={14} color={Colors.darkMedGray} />
          </View>
          <ThemedText style={styles.tipText}>
            Position artwork in center
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.tipItem}>
          <View style={styles.tipIconContainer}>
            <FontAwesome name="camera" size={14} color={Colors.darkMedGray} />
          </View>
          <ThemedText style={styles.tipText}>Hold camera steady</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Action Button */}
      <Pressable style={styles.actionButton} onPress={onClose}>
        <ThemedText style={styles.actionButtonText}>Try Again</ThemedText>
      </Pressable>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modal}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {success ? renderSuccessContent() : renderFailureContent()}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: SCREEN_WIDTH - 40,
    maxHeight: "80%",
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  artworkTitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
    color: Colors.darkMedGray,
  },
  statusContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  newVisitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.lightYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newVisitText: {
    color: Colors.darkYellow,
    fontSize: 14,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.lightGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpText: {
    color: Colors.darkGreen,
    fontSize: 14,
  },
  revisitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.medLightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  revisitText: {
    color: Colors.darkMedGray,
    fontSize: 14,
  },
  questsSection: {
    width: "100%",
    marginBottom: 24,
  },
  questsTitle: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  questItem: {
    backgroundColor: Colors.medLightGray,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  questHeader: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  questTitle: {
    flex: 1,
    fontSize: 14,
  },
  questProgress: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questProgressText: {
    fontSize: 12,
    color: Colors.darkMedGray,
  },
  completedBadge: {
    backgroundColor: Colors.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedText: {
    color: Colors.darkYellow,
    fontSize: 12,
  },
  failureMessage: {
    textAlign: "center",
    marginBottom: 16,
    color: Colors.darkMedGray,
  },
  tipsContainer: {
    width: "100%",
    marginBottom: 16,
  },
  tipsTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipIconContainer: {
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tipText: {
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  actionButton: {
    backgroundColor: Colors.darkGray,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  actionButtonText: {
    color: Colors.lightGray,
    textAlign: "center",
  },
});
