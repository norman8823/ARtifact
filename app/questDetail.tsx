import { ScreenHeader } from "@/components/ScreenHeader";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { PaywallModal } from "@/components/PaywallModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { useEntitlementContext } from "@/src/contexts/EntitlementContext";
import { type Artwork, useArtworksByIds } from "@/src/hooks/useArtworksByIds";
import { type Quest, useQuests } from "@/src/hooks/useQuests";
import { type UserQuest, useUserQuests } from "@/src/hooks/useUserQuests";
import { isQuestAccessible } from "@/src/utils/premiumAccess";
import * as Sentry from "@sentry/react-native";
import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";

interface QuestDetail {
  quest: Quest;
  userQuest: UserQuest | null;
  artworks: Artwork[];
}

export default function QuestDetailScreen() {
  const { isAuthReady, isAuthenticated } = useAuthContext();
  const {
    entitlement,
    isEntitled,
    priceLabel,
    isPurchasing,
    isRestoring,
    purchase,
    restore,
  } = useEntitlementContext();
  const params = useLocalSearchParams();
  const questId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { getAllQuests, isLoading: isLoadingQuest } = useQuests();
  const {
    getUserQuestByQuestId,
    startQuest,
    isLoading: isLoadingUserQuest,
  } = useUserQuests();
  const { getArtworksByIds, isLoading: isLoadingArtworks } = useArtworksByIds();

  const [questDetail, setQuestDetail] = useState<QuestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [pressedArtworkId, setPressedArtworkId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const loadQuestDetail = useCallback(async () => {
    if (!isAuthReady) return; // Wait for auth to be ready

    try {
      // Quest list and the user's progress are independent — fetch in parallel.
      const [quests, userQuest] = await Promise.all([
        getAllQuests(),
        getUserQuestByQuestId(questId),
      ]);
      const quest = quests.find((q: Quest) => q.id === questId);
      if (!quest) {
        throw new Error("Quest not found");
      }

      // Get the artwork details (depends on the resolved quest)
      const artworks = quest.requiredArtworks
        ? await getArtworksByIds(quest.requiredArtworks)
        : [];

      setQuestDetail({
        quest,
        userQuest,
        artworks,
      });
    } catch (err) {
      console.error("Error loading quest detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load quest");
    }
  }, [isAuthReady, questId, getAllQuests, getUserQuestByQuestId, getArtworksByIds]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadQuestDetail();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadQuestDetail]);

  useEffect(() => {
    if (questId && isAuthReady) {
      loadQuestDetail();
    }
  }, [questId, isAuthReady, loadQuestDetail]);

  /**
   * The single premium enforcement point for the whole app: startQuest has
   * exactly one call site, right here. The badges on artQuest/home are
   * cosmetic. Note this screen uses the legacy useQuests() rather than the
   * cached react-query wrapper, so it always reads fresh isPremium — stale
   * cache can only ever affect a badge, never the gate.
   */
  const runStartQuest = async () => {
    if (!questDetail?.quest) return;

    const { quest } = questDetail;

    // Validate that the quest has required artworks
    if (!quest.requiredArtworks || quest.requiredArtworks.length === 0) {
      setError("Quest must have required artworks");
      return;
    }

    setIsStarting(true);
    try {
      const result = await startQuest({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        icon: quest.icon,
        xpReward: quest.xpReward,
        requiredArtworks: quest.requiredArtworks,
        galleryMap: quest.galleryMap,
      });
      if (result) {
        // Update the local state with the new UserQuest
        setQuestDetail((prev) =>
          prev
            ? {
                ...prev,
                userQuest: result as UserQuest,
              }
            : null
        );
      }
    } catch (err) {
      console.error("Error starting quest:", err);
      setError(err instanceof Error ? err.message : "Failed to start quest");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartQuest = async () => {
    const quest = questDetail?.quest;
    if (!quest) return;

    // Auth is checked BEFORE premium, deliberately. This screen has no auth
    // guard and the app registers a deep-link scheme, so a guest can land here
    // via artifact://questDetail?id=X. Without this ordering they'd be shown a
    // paywall instead of a sign-in prompt.
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (
      !isQuestAccessible({
        isPremiumQuest: quest.isPremium,
        entitlement,
        hasStarted: !!questDetail?.userQuest,
      })
    ) {
      Sentry.addBreadcrumb({
        category: "paywall",
        message: "quest_start_blocked",
        data: { questId: quest.id },
      });
      setShowPaywall(true);
      return;
    }

    await runStartQuest();
  };

  const handleUnlock = async () => {
    try {
      await purchase();
    } catch {
      // Surfaced by the purchase error listener; leave the paywall open so the
      // user can retry or restore.
    }
  };

  const handleRestore = async () => {
    const outcome = await restore();
    if (outcome === "restored") {
      setShowPaywall(false);
      await runStartQuest();
    } else if (outcome === "nothing-to-restore") {
      Alert.alert(
        "Nothing to Restore",
        "No previous purchase was found for this Apple ID."
      );
    } else {
      Alert.alert(
        "App Store Unavailable",
        "Couldn't reach the App Store. Check your connection and try again."
      );
    }
  };

  // A purchase can complete while the paywall is open (including via
  // Ask-to-Buy, minutes later). When entitlement lands, close and continue
  // what the user was trying to do.
  useEffect(() => {
    if (showPaywall && isEntitled) {
      setShowPaywall(false);
      void runStartQuest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEntitled, showPaywall]);

  // Show loading state
  if (
    !isAuthReady ||
    isLoadingQuest ||
    isLoadingUserQuest ||
    isLoadingArtworks
  ) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // Show error state
  if (error || !questDetail) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>
          {error || "Could not load quest details. Please try again."}
        </ThemedText>
      </ThemedView>
    );
  }

  const { quest, userQuest, artworks } = questDetail;

  // Calculate progress
  const progress = userQuest
    ? {
        current: userQuest.artworksVisited.length,
        total: userQuest.requiredArtworks.length,
      }
    : {
        current: 0,
        total: artworks.length,
      };

  // Determine quest status
  const getQuestStatus = () => {
    if (!userQuest) return "Not Started";
    if (userQuest.isCompleted) return "Completed";
    return "In Progress";
  };

  const questStatus = getQuestStatus();

  // Cosmetic: drives the Start button label. Enforcement lives in
  // handleStartQuest, which re-checks rather than trusting this.
  const isQuestLocked =
    !!questDetail?.quest &&
    !isQuestAccessible({
      isPremiumQuest: questDetail.quest.isPremium,
      entitlement,
      hasStarted: !!questDetail.userQuest,
    });

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.darkMedGray}
            colors={[Colors.darkMedGray]}
          />
        }
      >
        {/* Quest Info Card */}
        <ThemedView style={styles.questCard}>
          <ThemedView style={styles.questHeader}>
            <ThemedView style={styles.headerLeft}>
              <ThemedView>
                <ThemedText type="title" style={styles.questTitle}>
                  {quest.title}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.xpBadge}>
              <ThemedText style={styles.xpText}>{quest.xpReward} XP</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText style={styles.description}>
            {quest.description}
          </ThemedText>

          {/* Progress Bar - Only show if quest is started */}
          {userQuest && (
            <ThemedView style={styles.progressBar}>
              <ThemedView
                style={[
                  styles.progressFill,
                  {
                    width: `${(progress.current / progress.total) * 100}%`,
                    backgroundColor: userQuest?.isCompleted
                      ? Colors.darkGreen
                      : Colors.lightYellow,
                  },
                ]}
              />
            </ThemedView>
          )}

          {/* Progress Tracker - Only show if quest is started.
              There is deliberately no "Not Started" badge for the other case:
              the button directly below already reads "Start Quest" or "Unlock
              to Start", so a badge saying the same thing is pure noise. */}
          {userQuest && (
            <ThemedView style={styles.progressTracker}>
              <ThemedView style={styles.progressLeft}>
                <FontAwesome
                  name="check-circle"
                  size={16}
                  color={Colors.darkGreen}
                  style={styles.checkIcon}
                />
                <ThemedText style={styles.progressText}>
                  {progress.current}/{progress.total} artworks visited
                </ThemedText>
              </ThemedView>
              <ThemedView
                style={[
                  styles.statusBadge,
                  questStatus === "Completed" && styles.completedBadge,
                  questStatus === "In Progress" && styles.inProgressBadge,
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    questStatus === "Completed" && styles.completedText,
                    questStatus === "In Progress" && styles.inProgressText,
                  ]}
                >
                  {questStatus}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {/* Start Quest Button — one onPress path whether locked or not, so
              there is no reachable state where an unlocked-looking button
              starts a premium quest. */}
          {!userQuest && (
            <Pressable
              style={[
                styles.startButton,
                isStarting && styles.startButtonDisabled,
              ]}
              onPress={handleStartQuest}
              disabled={isStarting}
            >
              {isStarting ? (
                <ActivityIndicator color={Colors.lightGray} />
              ) : isQuestLocked ? (
                <ThemedView style={styles.startButtonLockedRow}>
                  <FontAwesome name="lock" size={14} color={Colors.lightGray} />
                  <ThemedText style={styles.startButtonText}>
                    Unlock to Start
                  </ThemedText>
                </ThemedView>
              ) : (
                <ThemedText style={styles.startButtonText}>
                  Start Quest
                </ThemedText>
              )}
            </Pressable>
          )}
        </ThemedView>

        {/* Artworks Section */}
        <ThemedView style={styles.artworksSection}>
          {/* Instruction Text */}
          <ThemedView style={styles.instructionContainer}>
            <ThemedText style={styles.instructionText}>
              Scan the artworks below to complete the quest!
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Artworks to Discover
            </ThemedText>
            {/* {quest.galleryMap && (
              <Pressable style={styles.mapButton}>
                <FontAwesome
                  name="map-marker"
                  size={14}
                  color={Colors.darkMedGray}
                />
                <ThemedText style={styles.mapButtonText}>
                  View on Map
                </ThemedText>
              </Pressable>
            )} */}
          </ThemedView>

          {/* Artwork Cards */}
          {artworks.map((artwork) => (
            <Pressable
              key={artwork.id}
              style={[
                styles.artworkCard,
                userQuest?.artworksVisited.includes(artwork.id) &&
                  styles.artworkCardVisited,
                pressedArtworkId === artwork.id && styles.artworkCardPressed,
              ]}
              onPress={() => {
                router.push({
                  pathname: "/artDetail",
                  params: {
                    id: artwork.id,
                    source: "Quest Detail",
                  },
                });
              }}
              onPressIn={() => setPressedArtworkId(artwork.id)}
              onPressOut={() => setPressedArtworkId(null)}
            >
              <ThemedView
                style={[
                  styles.artworkContent,
                  userQuest?.artworksVisited.includes(artwork.id) && {
                    backgroundColor: Colors.lightGreen,
                  },
                ]}
              >
                {/* Artwork Image or Placeholder */}
                <ThemedView style={styles.artworkImage}>
                  {artwork.primaryImageSmall ? (
                    <Image
                      source={{ uri: artwork.primaryImageSmall }}
                      style={styles.image}
                    />
                  ) : (
                    <ThemedView style={styles.imagePlaceholder}>
                      <FontAwesome
                        name="image"
                        size={24}
                        color={Colors.darkMedGray}
                      />
                    </ThemedView>
                  )}
                </ThemedView>

                {/* Artwork Info */}
                <ThemedView
                  style={[
                    styles.artworkInfo,
                    userQuest?.artworksVisited.includes(artwork.id) && {
                      backgroundColor: Colors.lightGreen,
                    },
                  ]}
                >
                  <ThemedView
                    style={[
                      styles.artworkHeader,
                      userQuest?.artworksVisited.includes(artwork.id) && {
                        backgroundColor: Colors.lightGreen,
                      },
                    ]}
                  >
                    <ThemedText
                      type="title"
                      style={styles.artworkTitle}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {artwork.title}
                    </ThemedText>
                    {/* Only show visited badge if quest is started */}
                    {userQuest && (
                      <ThemedView
                        style={[
                          styles.visitedBadge,
                          !userQuest?.artworksVisited.includes(artwork.id) &&
                            styles.notVisitedBadge,
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.visitedText,
                            !userQuest?.artworksVisited.includes(artwork.id) &&
                              styles.notVisitedText,
                          ]}
                        >
                          {userQuest?.artworksVisited.includes(artwork.id)
                            ? "Visited"
                            : "Not Visited"}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                  <ThemedText
                    type="subtitle"
                    style={styles.artworkDetails}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {artwork.artistDisplayName || "Unknown Artist"}
                  </ThemedText>
                  {artwork.galleryNumber && (
                    <ThemedView
                      style={[
                        styles.locationInfo,
                        userQuest?.artworksVisited.includes(artwork.id) && {
                          backgroundColor: Colors.lightGreen,
                        },
                      ]}
                    >
                      <FontAwesome
                        name="map-marker"
                        size={12}
                        color={Colors.darkMedGray}
                      />
                      <ThemedText type="subtitle" style={styles.locationText}>
                        Gallery {artwork.galleryNumber}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>
      </ScrollView>

      {/* Guest reached here via deep link and tried to start a quest. */}
      <AuthPromptModal
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        context="quest"
      />

      {/* Signed-in free user tried to start a premium quest. */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        context="quest-start"
        questTitle={questDetail?.quest?.title}
        priceLabel={priceLabel}
        isPurchasing={isPurchasing}
        isRestoring={isRestoring}
        // Don't gate the CTA on fetchProducts succeeding — requestPurchase
        // doesn't need the product object, and an empty product list is
        // usually an App Store Connect state, not a device problem.
        canPurchase={entitlement !== "unknown" || priceLabel !== null}
        onUnlock={handleUnlock}
        onRestore={handleRestore}
      />
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
  questCard: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 36,
    ...shadowStyle,
  },
  questHeader: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightYellow,
    alignItems: "center",
    justifyContent: "center",
  },
  questTitle: {
    backgroundColor: Colors.medLightGray,
  },
  xpBadge: {
    backgroundColor: Colors.medLightGray,
    marginLeft: 12,
    alignSelf: "flex-start",
  },
  xpText: {
    color: Colors.darkMedGray,
    fontSize: 14,
  },
  description: {
    marginBottom: 16,
  },
  instructionContainer: {
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  instructionText: {
    fontSize: 12,
    color: Colors.darkMedGray,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressBar: {
    height: 16,
    backgroundColor: Colors.medGray,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.lightYellow,
    borderRadius: 8,
  },
  progressTracker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.medLightGray,
  },
  progressLeft: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkIcon: {},
  progressText: {
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
  },
  artworksSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {},
  // mapButton: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 4,
  //   padding: 8,
  // },
  // mapButtonText: {
  //   color: Colors.darkMedGray,
  //   fontSize: 14,
  // },
  artworkCard: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.medGray,
    ...shadowStyle,
  },
  artworkCardPressed: {
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: -1, height: -1 },
    shadowColor: '#000',
    elevation: 0,
    transform: [{ translateY: 1 }],
  },
  artworkCardVisited: {
    borderLeftColor: Colors.darkGreen,
    backgroundColor: Colors.lightGreen,
  },
  artworkContent: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  artworkImage: {
    width: 90,
    height: 90,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.medLightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  artworkInfo: {
    backgroundColor: Colors.medLightGray,
    flex: 1,
    justifyContent: "center",
  },
  artworkHeader: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  artworkTitle: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  visitedBadge: {
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  visitedText: {
    color: Colors.lightGray,
    fontSize: 12,
  },
  notVisitedBadge: {
    backgroundColor: Colors.lightYellow,
  },
  notVisitedText: {
    color: Colors.darkYellow,
  },
  artworkDetails: {
    fontSize: 14,
    color: Colors.darkMedGray,
    marginBottom: 4,
  },
  locationInfo: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.darkMedGray,
  },
  completedBadge: {
    backgroundColor: Colors.darkGreen,
  },
  completedText: {
    color: Colors.lightGray,
  },
  inProgressBadge: {
    backgroundColor: Colors.lightYellow,
  },
  inProgressText: {
    color: Colors.darkYellow,
  },
  startButton: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  startButtonDisabled: {
    backgroundColor: Colors.medGray,
  },
  startButtonLockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  startButtonText: {
    color: Colors.lightGray,
  },
});
