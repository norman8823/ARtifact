import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { type Quest as BaseQuest, useQuests } from "@/src/hooks/useQuests";
import { type UserQuest, useUserQuests } from "@/src/hooks/useUserQuests";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

type QuestDifficulty = "Easy" | "Medium" | "Hard";

interface ActiveQuest extends BaseQuest {
  progress: {
    current: number;
    total: number;
  };
}

export default function ArtQuestScreen() {
  const {
    getAllQuests,
    isLoading: isLoadingQuests,
    error: questsError,
  } = useQuests();
  const {
    getUserQuests,
    isLoading: isLoadingUserQuests,
    error: userQuestsError,
  } = useUserQuests();

  const [availableQuests, setAvailableQuests] = useState<BaseQuest[]>([]);
  const [activeQuests, setActiveQuests] = useState<UserQuest[]>([]);

  const loadQuests = useCallback(async () => {
    const [allQuests, userQuests] = await Promise.all([
      getAllQuests(),
      getUserQuests(),
    ]);

    // Filter out quests that the user has already started
    const startedQuestIds = new Set(
      userQuests.map((uq: UserQuest) => uq.questId)
    );
    const available = allQuests.filter(
      (quest: BaseQuest) => !startedQuestIds.has(quest.id)
    );

    setAvailableQuests(available);
    setActiveQuests(userQuests);
  }, [getAllQuests, getUserQuests]);

  // Initial load
  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadQuests();
    }, [loadQuests])
  );

  // Show loading state
  if (isLoadingQuests || isLoadingUserQuests) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ThemedText>Loading quests...</ThemedText>
      </ThemedView>
    );
  }

  // Show error state
  if (questsError || userQuestsError) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ThemedText>
          Error loading quests: {(questsError || userQuestsError)?.message}
        </ThemedText>
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
          <FontAwesome name="trophy" size={24} color="#F59E0B" />
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

        {activeQuests.length === 0 ? (
          <ThemedView style={styles.emptyStateContainer}>
            <ThemedText style={styles.emptyStateText}>
              You haven't started any quests yet. Begin your journey by
              selecting a quest below!
            </ThemedText>
          </ThemedView>
        ) : (
          activeQuests.map((quest) => (
            <Pressable
              key={quest.id}
              style={styles.questCard}
              onPress={() => router.push(`/questDetail?id=${quest.questId}`)}
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
                          (quest.artworksVisited.length /
                            quest.requiredArtworks.length) *
                          100
                        }%`,
                      },
                    ]}
                  />
                </ThemedView>
                <ThemedView style={styles.progressText}>
                  <ThemedText style={styles.progressCount}>
                    {quest.artworksVisited.length}/
                    {quest.requiredArtworks.length} visited
                  </ThemedText>
                  <ThemedText style={styles.progressPercentage}>
                    {Math.round(
                      (quest.artworksVisited.length /
                        quest.requiredArtworks.length) *
                        100
                    )}
                    %
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              {quest.galleryMap && (
                <ThemedView style={styles.locationContainer}>
                  <FontAwesome name="map-marker" size={14} color="#666" />
                  <ThemedText style={styles.locationText}>
                    {quest.galleryMap}
                  </ThemedText>
                </ThemedView>
              )}
            </Pressable>
          ))
        )}
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

            {quest.galleryMap && (
              <ThemedView style={styles.locationContainer}>
                <FontAwesome name="map-marker" size={14} color="#666" />
                <ThemedText style={styles.locationText}>
                  {quest.galleryMap}
                </ThemedText>
              </ThemedView>
            )}
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
    paddingBottom: 80,
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
    backgroundColor: "#FEF3C7",
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
    fontWeight: "500",
    color: "#000",
  },
  badge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: "#D97706",
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
    borderColor: "#eee",
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
    fontWeight: "500",
    color: "#000",
    flex: 1,
    paddingRight: 8,
  },
  questDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  xpBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  xpText: {
    color: "#16a34a",
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FEF3C7",
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
    color: "#666",
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
  emptyStateContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
    lineHeight: 24,
  },
});
