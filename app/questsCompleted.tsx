import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { type UserQuest, useUserQuests } from "@/src/hooks/useUserQuests";
import { FontAwesome } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";

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
          <FontAwesome name="trophy" size={48} color={Colors.darkMedGray} />
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
                <ThemedText type="title" style={styles.questTitle}>
                  {quest.title}
                </ThemedText>
                <ThemedView style={styles.xpBadge}>
                  <ThemedText style={styles.xpText}>
                    +{quest.xpReward} XP
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.questDescription}>
                {quest.description}
              </ThemedText>
              <ThemedView style={styles.questFooter}>
                <ThemedView style={styles.completedStatus}>
                  <FontAwesome
                    name="check-circle"
                    size={14}
                    color={Colors.darkGreen}
                  />
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
    backgroundColor: Colors.lightGray,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  questList: {
    gap: 12,
  },
  questCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.lightGreen,
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  questHeader: {
    backgroundColor: Colors.lightGreen,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  questTitle: {
    fontSize: 20,
  },
  questDescription: {},
  xpBadge: {
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  xpText: {
    color: Colors.lightGray,
    fontSize: 12,
  },
  questFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.lightGreen,
    marginTop: 16,
  },
  completedStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.lightGreen,
  },
  completedText: {
    fontSize: 12,
    color: Colors.darkGreen,
  },
  dateText: {
    fontSize: 12,
    color: Colors.darkGreen,
  },
  errorText: {
    textAlign: "center",
    marginHorizontal: 24,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.darkMedGray,
    textAlign: "center",
  },
});
