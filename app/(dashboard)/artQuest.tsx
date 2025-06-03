import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { type Quest as BaseQuest, useQuests } from "@/src/hooks/useQuests";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

type QuestDifficulty = "Easy" | "Medium" | "Hard";

interface ActiveQuest extends BaseQuest {
  progress: {
    current: number;
    total: number;
  };
}

export default function ArtQuestScreen() {
  const { getAllQuests, isLoading, error } = useQuests();
  const [availableQuests, setAvailableQuests] = useState<BaseQuest[]>([]);

  // Fetch quests when component mounts
  useEffect(() => {
    getAllQuests().then((quests) => {
      setAvailableQuests(quests);
    });
  }, [getAllQuests]);

  const [activeQuests] = useState<ActiveQuest[]>([
    {
      id: "1",
      title: "Euro Trip",
      description: "Visit 3 masterpieces from different European countries",
      xpReward: 300,
      icon: null,
      requiredArtworks: null,
      isPremium: false,
      galleryMap: "Gallery 24, European Collection",
      progress: {
        current: 2,
        total: 3,
      },
    },
    {
      id: "2",
      title: "Time Warp",
      description: "Visit artworks from 3 different centuries",
      xpReward: 250,
      icon: null,
      requiredArtworks: null,
      isPremium: false,
      galleryMap: "Various Galleries",
      progress: {
        current: 1,
        total: 3,
      },
    },
  ]);

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ThemedText>Loading quests...</ThemedText>
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ThemedText>Error loading quests: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* User Stats Section */}
      <ThemedView style={styles.statsSection}>
        <ThemedView>
          <ThemedText style={styles.rankTitle}>Art Explorer</ThemedText>
          <ThemedText style={styles.levelText}>Level 3</ThemedText>
        </ThemedView>
        <ThemedView style={styles.medalContainer}>
          <FontAwesome name="trophy" size={24} color="#FFB800" />
        </ThemedView>
      </ThemedView>

      {/* Active Quests Section */}
      <ThemedView style={styles.section}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Active Quests</ThemedText>
          <ThemedView style={styles.badge}>
            <ThemedText style={styles.badgeText}>
              {activeQuests.length} In Progress
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {activeQuests.map((quest) => (
          <Pressable
            key={quest.id}
            style={styles.questCard}
            onPress={() => router.push(`/questDetail?id=${quest.id}`)}
          >
            <ThemedView style={styles.questHeader}>
              <ThemedView style={styles.questInfo}>
                <ThemedView style={styles.titleRow}>
                  <ThemedText style={styles.questTitle}>
                    {quest.title}
                  </ThemedText>
                  <ThemedView style={styles.xpBadge}>
                    <ThemedText style={styles.xpText}>
                      {quest.xpReward} XP
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedText style={styles.questDescription}>
                  {quest.description}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.progressContainer}>
              <ThemedView style={styles.progressBar}>
                <ThemedView
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (quest.progress!.current / quest.progress!.total) * 100
                      }%`,
                    },
                  ]}
                />
              </ThemedView>
              <ThemedView style={styles.progressText}>
                <ThemedText style={styles.progressCount}>
                  {quest.progress!.current}/{quest.progress!.total} visited
                </ThemedText>
                <ThemedText style={styles.progressPercentage}>
                  {Math.round(
                    (quest.progress!.current / quest.progress!.total) * 100
                  )}
                  %
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.locationContainer}>
              <FontAwesome name="map-marker" size={14} color="#666" />
              <ThemedText style={styles.locationText}>
                {quest.galleryMap}
              </ThemedText>
            </ThemedView>
          </Pressable>
        ))}
      </ThemedView>

      {/* Available Quests Section */}
      <ThemedView style={styles.section}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Available Quests</ThemedText>
          <ThemedView style={[styles.badge, styles.grayBadge]}>
            <ThemedText style={[styles.badgeText, styles.grayText]}>
              {availableQuests.length} Available
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {availableQuests.map((quest) => (
          <Pressable
            key={quest.id}
            style={styles.questCard}
            onPress={() => router.push(`/questDetail?id=${quest.id}`)}
          >
            <ThemedView style={styles.questHeader}>
              <ThemedView style={styles.questInfo}>
                <ThemedView style={styles.titleRow}>
                  <ThemedText style={styles.questTitle}>
                    {quest.title}
                  </ThemedText>
                  {quest.isPremium && (
                    <ThemedView style={styles.premiumBadge}>
                      <ThemedText style={styles.premiumText}>
                        Premium
                      </ThemedText>
                    </ThemedView>
                  )}
                  <ThemedView style={styles.xpBadge}>
                    <ThemedText style={styles.xpText}>
                      {quest.xpReward} XP
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedText style={styles.questDescription}>
                  {quest.description}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.questFooter}>
              <Pressable style={styles.startButton}>
                <ThemedText style={styles.startButtonText}>Start</ThemedText>
              </Pressable>
            </ThemedView>
          </Pressable>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingBottom: 100,
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rankTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  levelText: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  medalContainer: {
    backgroundColor: "#FFF8E7",
    padding: 12,
    borderRadius: 50,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  badge: {
    backgroundColor: "#EBF5FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: "#0066CC",
    fontSize: 14,
    fontWeight: "500",
  },
  grayBadge: {
    backgroundColor: "#F5F5F5",
  },
  grayText: {
    color: "#666",
  },
  questCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  questHeader: {
    marginBottom: 12,
  },
  questInfo: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    paddingRight: 8,
  },
  questDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  xpBadge: {
    backgroundColor: "#EBF5FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  xpText: {
    color: "#0066CC",
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0066CC",
    borderRadius: 4,
  },
  progressText: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressCount: {
    fontSize: 12,
    color: "#666",
  },
  progressPercentage: {
    fontSize: 12,
    color: "#0066CC",
    fontWeight: "500",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
  },
  questFooter: {
    alignItems: "center",
    marginTop: 12,
  },
  startButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  premiumBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  premiumText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
});
