import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { type UserQuest, useUserQuests } from "@/src/hooks/useUserQuests";
import { FontAwesome } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";

export default function QuestsCompletedScreen() {
  const { getUserQuests, isLoading, error } = useUserQuests();
  const [completedQuests, setCompletedQuests] = useState<UserQuest[]>([]);

  useEffect(() => {
    const loadCompletedQuests = async () => {
      try {
        const userQuests = await getUserQuests();
        const completed = userQuests
          .filter((quest: UserQuest) => quest.isCompleted)
          .sort((a: UserQuest, b: UserQuest) => {
            // Sort by timestamp in descending order (most recent first)
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return dateB.getTime() - dateA.getTime();
          });
        setCompletedQuests(completed);
      } catch (err) {
        console.error("Error loading completed quests:", err);
      }
    };

    loadCompletedQuests();
  }, [getUserQuests]);

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            title: "Quests Completed",
            headerShadowVisible: false,
          }}
        />
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            title: "Quests Completed",
            headerShadowVisible: false,
          }}
        />
        <ThemedText style={styles.errorText}>
          Error loading quests: {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  // Show empty state
  if (completedQuests.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            title: "Quests Completed",
            headerShadowVisible: false,
          }}
        />
        <ThemedView style={styles.emptyState}>
          <FontAwesome name="trophy" size={48} color="#bbf7d0" />
          <ThemedText style={styles.emptyStateTitle}>
            No Quests Completed Yet
          </ThemedText>
          <ThemedText style={styles.emptyStateText}>
            Complete quests to earn XP and unlock new ranks!
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Quests Completed",
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.questList}>
          {completedQuests.map((quest) => (
            <ThemedView key={quest.id} style={styles.questCard}>
              <ThemedView style={styles.questHeader}>
                <ThemedView style={styles.questInfo}>
                  <ThemedText style={styles.questTitle}>
                    {quest.title}
                  </ThemedText>
                  <ThemedText style={styles.questDescription}>
                    {quest.description}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.xpBadge}>
                  <ThemedText style={styles.xpText}>
                    +{quest.xpReward} XP
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.questFooter}>
                <ThemedView style={styles.completedStatus}>
                  <FontAwesome name="check-circle" size={14} color="#16a34a" />
                  <ThemedText style={styles.completedText}>
                    Completed
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.dateText}>
                  {new Date(quest.timestamp).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 80,
  },
  questList: {
    gap: 16,
  },
  questCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  questHeader: {
    backgroundColor: "#f0fdf4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  questInfo: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  questTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#166534",
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 14,
    color: "#15803d",
    flexShrink: 1,
  },
  xpBadge: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  xpText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  questFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
  },
  completedStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
  },
  completedText: {
    fontSize: 12,
    color: "#15803d",
  },
  dateText: {
    fontSize: 12,
    color: "#15803d",
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
    marginHorizontal: 24,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#166534",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#15803d",
    textAlign: "center",
  },
});
