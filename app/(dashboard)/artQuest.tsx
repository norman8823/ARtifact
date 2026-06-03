import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { QuestArtworkThumbnails } from "@/components/QuestArtworkThumbnails";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { useAuthContext } from "@/src/contexts/AuthContext";
import {
  useAllQuestsQuery,
  useAllRanksQuery,
  useUserQuestsQuery,
  useUserXPQuery,
} from "@/src/hooks/queries";
import { type Quest as BaseQuest } from "@/src/hooks/useQuests";
import { type Rank } from "@/src/hooks/useRanks";
import { type UserQuest } from "@/src/hooks/useUserQuests";
import { type UserXP } from "@/src/hooks/useUserXP";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
} from "react-native";

type QuestDifficulty = "Easy" | "Medium" | "Hard";

interface ActiveQuest extends BaseQuest {
  progress: {
    current: number;
    total: number;
  };
}

type FlatListItem =
  | { type: 'header'; data: { userXP: UserXP | null; currentRank: Rank | null } }
  | { type: 'activeHeader'; data: { count: number } }
  | { type: 'activeQuest'; data: UserQuest }
  | { type: 'activeEmpty'; data: { completedCount: number; availableCount: number } }
  | { type: 'completedHeader'; data: { count: number } }
  | { type: 'completedQuest'; data: UserQuest }
  | { type: 'completedEmpty' }
  | { type: 'availableHeader'; data: { count: number } }
  | { type: 'availableQuest'; data: BaseQuest };

// Helper function to deduplicate gallery numbers
const deduplicateGalleries = (galleryMap: string | null): string => {
  if (!galleryMap) return '';

  // Extract gallery numbers using regex to find patterns like "Gallery 908" or "Galleries 908, 910, 908"
  const galleryNumbers = galleryMap.match(/\d+/g) || [];
  const uniqueNumbers = [...new Set(galleryNumbers)];

  // Reconstruct the text with deduplicated numbers
  if (uniqueNumbers.length === 0) return galleryMap;
  if (uniqueNumbers.length === 1) return `Gallery ${uniqueNumbers[0]}`;
  return `Galleries ${uniqueNumbers.join(', ')}`;
};

// Memoized components for better performance
const UserStatsHeader = React.memo(({ userXP, currentRank }: { userXP: UserXP | null; currentRank: Rank | null }) => (
  <ThemedView style={styles.statsSection}>
    <ThemedView>
      <ThemedText type="title" style={styles.pageTitle}>
        Art Quests
      </ThemedText>
      <ThemedView style={styles.rankSection}>
        <FontAwesome name={currentRank?.icon as any || "trophy"} size={16} color={Colors.darkYellow} />
        <ThemedText style={styles.rankText}>
          {currentRank?.title || "Loading rank..."} • {userXP?.xpPoints || 0} XP
        </ThemedText>
      </ThemedView>
    </ThemedView>
  </ThemedView>
));

const ActiveQuestItem = React.memo(({ quest, questLookup, isCompleted = false }: { quest: UserQuest; questLookup: Map<string, BaseQuest>; isCompleted?: boolean }) => {
  const [isPressed, setIsPressed] = useState(false);
  // Get artwork thumbnails from the base quest data
  const baseQuest = questLookup.get(quest.questId);
  const artworkThumbnails = baseQuest?.artworkThumbnails || [];

  // Simple thumbnail logging
  if (artworkThumbnails.length === 0) {
    console.log(`⚠️ No thumbnails for quest "${quest.title}"`);
  }


  return (
    <Pressable
      style={[styles.questCard, isPressed && styles.questCardPressed]}
      onPress={() => router.push(`/questDetail?id=${quest.questId}`)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
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
          {/* Show artwork thumbnails with progress */}
          {artworkThumbnails.length > 0 && (
            <QuestArtworkThumbnails
              artworks={artworkThumbnails}
              visitedArtworkIds={quest.artworksVisited}
              isCompleted={isCompleted}
            />
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.progressContainer}>
        <ThemedView style={styles.progressBar}>
          <ThemedView
            style={[
              styles.progressFill,
              {
                width: `${
                  (quest.artworksVisited.length / quest.requiredArtworks.length) * 100
                }%`,
                backgroundColor: quest.isCompleted
                  ? Colors.darkGreen
                  : Colors.lightYellow,
              },
            ]}
          />
        </ThemedView>
        <ThemedView style={styles.progressText}>
          <ThemedText style={styles.progressCount}>
            {quest.artworksVisited.length}/{quest.requiredArtworks.length} visited
          </ThemedText>
          <ThemedText style={styles.progressPercentage}>
            {Math.round(
              (quest.artworksVisited.length / quest.requiredArtworks.length) * 100
            )}%
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Use fresh description from baseQuest lookup instead of stale UserQuest description */}
      {(baseQuest?.description || quest.description) && (
        <ThemedView style={styles.descriptionContainer}>
          <ThemedText style={styles.descriptionText}>
            {baseQuest?.description || quest.description}
          </ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
});

const AvailableQuestItem = React.memo(({ quest }: { quest: BaseQuest }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      style={[styles.questCard, isPressed && styles.questCardPressed]}
      onPress={() => router.push(`/questDetail?id=${quest.id}`)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
    <ThemedView style={styles.questHeader}>
      <ThemedView style={styles.questInfo}>
        <ThemedView style={styles.titleRow}>
          <ThemedText type="title" style={styles.questTitle}>
            {quest.title}
          </ThemedText>
          {quest.isPremium && (
            <ThemedView style={styles.premiumBadge}>
              <ThemedText style={styles.premiumText}>Premium</ThemedText>
            </ThemedView>
          )}
          <ThemedView style={styles.xpBadge}>
            <ThemedText style={styles.xpText}>{quest.xpReward} XP</ThemedText>
          </ThemedView>
        </ThemedView>
        {/* Show artwork thumbnails instead of description */}
        {quest.artworkThumbnails && quest.artworkThumbnails.length > 0 && (
          <QuestArtworkThumbnails
            artworks={quest.artworkThumbnails}
            visitedArtworkIds={[]} // Available quests have no progress
          />
        )}
      </ThemedView>
    </ThemedView>

    {quest.description && (
      <ThemedView style={styles.descriptionContainer}>
        <ThemedText style={styles.descriptionText}>{quest.description}</ThemedText>
      </ThemedView>
    )}
  </Pressable>
  );
});

export default function ArtQuestScreen() {
  const { isAuthReady, isAuthenticated } = useAuthContext();
  const {
    data: allQuestsData,
    isLoading: isLoadingQuests,
    error: questsError,
    refetch: refetchQuests,
  } = useAllQuestsQuery();
  const {
    data: userQuestsData,
    isLoading: isLoadingUserQuests,
    error: userQuestsError,
    refetch: refetchUserQuests,
  } = useUserQuestsQuery();
  const {
    data: xpData,
    isLoading: isLoadingUserXP,
    error: userXPError,
    refetch: refetchXP,
  } = useUserXPQuery();
  const {
    data: ranksData,
    isLoading: isLoadingRanks,
    error: ranksError,
    refetch: refetchRanks,
  } = useAllRanksQuery();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const userXP: UserXP | null = xpData ?? null;

  // Derive quest groupings + lookup from the cached quest data (was loadData).
  const { availableQuests, activeQuests, completedQuests, questLookup } =
    useMemo(() => {
      const allQuests = allQuestsData ?? [];
      const userQuests = userQuestsData ?? [];

      const active = userQuests.filter((uq) => !uq.isCompleted);
      const completed = userQuests.filter((uq) => uq.isCompleted);
      const startedQuestIds = new Set(userQuests.map((uq) => uq.questId));
      const available = allQuests.filter((q) => !startedQuestIds.has(q.id));

      const lookup = new Map<string, BaseQuest>();
      allQuests.forEach((q) => lookup.set(q.id, q));

      return {
        availableQuests: available,
        activeQuests: active,
        completedQuests: completed,
        questLookup: lookup,
      };
    }, [allQuestsData, userQuestsData]);

  // Derive current rank from XP + ranks (replaces the getRankByXP fetch).
  const currentRank = useMemo<Rank | null>(() => {
    const ranks = ranksData ?? [];
    if (userXP && ranks.length > 0) {
      return (
        ranks.find(
          (r) => userXP.xpPoints >= r.minXP && userXP.xpPoints <= r.maxXP
        ) || ranks[0]
      );
    }
    return null;
  }, [userXP, ranksData]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      console.log("User not authenticated in ArtQuest, redirecting to login");
      router.replace("/");
    }
  }, [isAuthReady, isAuthenticated]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchQuests(),
        refetchUserQuests(),
        refetchXP(),
        refetchRanks(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchQuests, refetchUserQuests, refetchXP, refetchRanks]);

  // Prepare data for FlatList
  const flatListData: FlatListItem[] = [
    { type: 'header', data: { userXP, currentRank } },
    { type: 'activeHeader', data: { count: activeQuests.length } },
    ...(activeQuests.length === 0
      ? [{ type: 'activeEmpty' as const, data: { completedCount: completedQuests.length, availableCount: availableQuests.length } }]
      : activeQuests.map(quest => ({ type: 'activeQuest' as const, data: quest }))
    ),
    { type: 'availableHeader', data: { count: availableQuests.length } },
    ...availableQuests.map(quest => ({ type: 'availableQuest' as const, data: quest })),
    { type: 'completedHeader', data: { count: completedQuests.length } },
    ...(completedQuests.length === 0
      ? [{ type: 'completedEmpty' as const }]
      : completedQuests.map(quest => ({ type: 'completedQuest' as const, data: quest }))
    )
  ];

  const renderItem = useCallback(({ item }: { item: FlatListItem }) => {
    switch (item.type) {
      case 'header':
        return <UserStatsHeader userXP={item.data.userXP} currentRank={item.data.currentRank} />;

      case 'activeHeader':
        return (
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Active Quests
              </ThemedText>
              <ThemedView style={[styles.badge, styles.activeBadge]}>
                <ThemedText style={[styles.badgeText, styles.activeText]}>
                  {item.data.count} In Progress
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        );

      case 'activeEmpty':
        // Determine the appropriate message based on quest status
        let emptyMessage: string;
        if (item.data.availableCount === 0 && item.data.completedCount > 0) {
          // User has completed all available quests
          emptyMessage = "You've completed all available quests!";
        } else if (item.data.completedCount > 0) {
          // User has completed some quests but there are more available
          emptyMessage = "Continue your journey by selecting a quest below!";
        } else {
          // User hasn't started any quests yet
          emptyMessage = "Begin your journey by selecting a quest below!";
        }
        return (
          <ThemedView style={[styles.section, { paddingTop: 0 }]}>
            <ThemedView style={styles.emptyStateContainer}>
              <ThemedText style={styles.emptyStateText}>
                {emptyMessage}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        );

      case 'activeQuest':
        return (
          <ThemedView style={[styles.section, { paddingTop: 0 }]}>
            <ActiveQuestItem quest={item.data} questLookup={questLookup} />
          </ThemedView>
        );

      case 'completedHeader':
        return (
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Completed Quests
              </ThemedText>
              <ThemedView style={[styles.badge, styles.completedBadge]}>
                <ThemedText style={[styles.badgeText, styles.completedText]}>
                  {item.data.count} Completed
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        );

      case 'completedEmpty':
        return (
          <ThemedView style={[styles.section, { paddingTop: 0 }]}>
            <ThemedView style={styles.emptyStateContainer}>
              <ThemedText style={styles.emptyStateText}>
                Complete quests to see them here and earn rewards!
              </ThemedText>
            </ThemedView>
          </ThemedView>
        );

      case 'completedQuest':
        return (
          <ThemedView style={[styles.section, { paddingTop: 0 }]}>
            <ActiveQuestItem quest={item.data} questLookup={questLookup} isCompleted={true} />
          </ThemedView>
        );

      case 'availableHeader':
        return (
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Available Quests
              </ThemedText>
              <ThemedView style={[styles.badge, styles.grayBadge]}>
                <ThemedText style={[styles.badgeText, styles.grayText]}>
                  {item.data.count} Available
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        );

      case 'availableQuest':
        return (
          <ThemedView style={[styles.section, { paddingTop: 0 }]}>
            <AvailableQuestItem quest={item.data} />
          </ThemedView>
        );

      default:
        return null;
    }
  }, [questLookup]);

  // Data fetches on mount via the query hooks (enabled once authenticated).
  // No manual initial-load effect needed.

  // Removed useFocusEffect - no need to auto-refresh when returning from quest detail
  // Quest progress only changes when user scans artworks, which happens on quest detail page

  // Show loading state
  if (
    !isAuthReady ||
    !isAuthenticated ||
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
      <FlatList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.darkMedGray}
            colors={[Colors.darkMedGray]}
          />
        }
      />
    </SafeAreaView>
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
    padding: 20,
    paddingTop: 16,
  },
  pageTitle: {
    fontSize: 30,
  },
  rankSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },
  rankText: {
    color: Colors.darkMedGray,
    fontSize: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
  },
  activeBadge: {
    backgroundColor: Colors.lightYellow,
  },
  activeText: {
    color: Colors.darkYellow,
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
    ...shadowStyle,
  },
  questCardPressed: {
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: -1, height: -1 },
    shadowColor: '#000',
    elevation: 0,
    transform: [{ translateY: 1 }],
  },
  questHeader: {
    backgroundColor: Colors.medLightGray,
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
    backgroundColor: Colors.medLightGray,
    fontSize: 18,
    flex: 1,
    paddingRight: 8,
  },
  xpBadge: {
    backgroundColor: Colors.medLightGray,
    alignSelf: "flex-start",
  },
  xpText: {
    color: Colors.darkMedGray,
    fontSize: 14,
  },
  progressContainer: {
    backgroundColor: Colors.medLightGray,
    marginBottom: 4,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  descriptionContainer: {
    backgroundColor: Colors.medLightGray,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.darkMedGray,
    lineHeight: 18,
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
  },
  iconContainer: {
    backgroundColor: Colors.lightYellow,
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
  },
  completedBadge: {
    backgroundColor: Colors.lightGreen,
  },
  completedText: {
    color: Colors.darkGreen,
  },
});
