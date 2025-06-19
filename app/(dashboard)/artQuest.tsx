import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { type Quest as BaseQuest, useQuests } from "@/src/hooks/useQuests";
import { type Rank, useRanks } from "@/src/hooks/useRanks";
import { type UserQuest, useUserQuests } from "@/src/hooks/useUserQuests";
import { type UserXP, useUserXP } from "@/src/hooks/useUserXP";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Colors } from "../../constants/Colors";

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
  const {
    getUserXP,
    isLoading: isLoadingUserXP,
    error: userXPError,
  } = useUserXP();
  const {
    getRankByXP,
    isLoading: isLoadingRanks,
    error: ranksError,
  } = useRanks();

  const [availableQuests, setAvailableQuests] = useState<BaseQuest[]>([]);
  const [activeQuests, setActiveQuests] = useState<UserQuest[]>([]);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [currentRank, setCurrentRank] = useState<Rank | null>(null);

  const loadData = useCallback(async () => {
    const [allQuests, userQuests, xp] = await Promise.all([
      getAllQuests(),
      getUserQuests(),
      getUserXP(),
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
    setUserXP(xp);

    // Get user's rank based on XP
    if (xp) {
      const rank = await getRankByXP(xp.xpPoints);
      setCurrentRank(rank);
    }
  }, [getAllQuests, getUserQuests, getUserXP, getRankByXP]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Show loading state
  if (
    isLoadingQuests ||
    isLoadingUserQuests ||
    isLoadingUserXP ||
    isLoadingRanks
  ) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // Show error state
  if (questsError || userQuestsError || userXPError || ranksError) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ThemedText>
          Error loading content:{" "}
          {
            (questsError || userQuestsError || userXPError || ranksError)
              ?.message
          }
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          {/* User Stats Section */}
          <ThemedView style={styles.statsSection}>
            <ThemedView>
              <ThemedText type="title" style={styles.rankTitle}>
                {currentRank?.title || "Loading rank..."}
              </ThemedText>
              <ThemedText style={styles.levelText}>
                {userXP?.xpPoints || 0} XP
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.medalContainer}>
              <FontAwesome name="trophy" size={24} color={Colors.darkYellow} />
            </ThemedView>
          </ThemedView>

          {/* Active Quests Section */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Active Quests
              </ThemedText>
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
                  onPress={() =>
                    router.push(`/questDetail?id=${quest.questId}`)
                  }
                >
                  <ThemedView style={styles.questHeader}>
                    <ThemedView style={styles.questInfo}>
                      <ThemedView style={styles.titleRow}>
                        <ThemedText type="title" style={styles.questTitle}>
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
                      <FontAwesome
                        name="map-marker"
                        size={14}
                        color={Colors.darkMedGray}
                      />
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
              <ThemedText type="title" style={styles.sectionTitle}>
                Available Quests
              </ThemedText>
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
                      <ThemedText type="title" style={styles.questTitle}>
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
                    <FontAwesome
                      name="map-marker"
                      size={14}
                      color={Colors.darkMedGray}
                    />
                    <ThemedText style={styles.locationText}>
                      {quest.galleryMap}
                    </ThemedText>
                  </ThemedView>
                )}
              </Pressable>
            ))}
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
    paddingTop: 16,
  },
  rankTitle: {
    fontSize: 30,
  },
  levelText: {
    fontSize: 16,
    color: Colors.darkMedGray,
    marginTop: 4,
  },
  medalContainer: {
    backgroundColor: Colors.lightYellow,
    borderColor: Colors.darkYellow,
    borderWidth: 1,
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
  sectionTitle: {},
  badge: {
    backgroundColor: Colors.lightYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: Colors.darkYellow,
    fontSize: 14,
  },
  grayBadge: {
    backgroundColor: Colors.medLightGray,
  },
  grayText: {
    color: Colors.darkMedGray,
  },
  questCard: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  questInfo: {
    backgroundColor: Colors.medLightGray,
    gap: 4,
  },
  titleRow: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questTitle: {
    fontSize: 18,
    flex: 1,
    paddingRight: 8,
  },
  questDescription: {
    backgroundColor: Colors.medLightGray,
    fontSize: 14,
    marginBottom: 8,
  },
  xpBadge: {
    backgroundColor: Colors.lightGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  xpText: {
    color: Colors.darkGreen,
    fontSize: 14,
  },
  progressContainer: {
    backgroundColor: Colors.medLightGray,
    marginBottom: 12,
  },
  progressBar: {
    backgroundColor: Colors.medGray,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.lightYellow,
    borderRadius: 4,
  },
  progressText: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressCount: {
    fontSize: 12,
    color: Colors.darkMedGray,
  },
  progressPercentage: {
    fontSize: 12,
    color: Colors.darkMedGray,
  },
  locationContainer: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  questFooter: {
    alignItems: "center",
    marginTop: 12,
  },
  premiumBadge: {
    backgroundColor: Colors.lightYellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  premiumText: {
    color: Colors.darkYellow,
    fontSize: 14,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
});
