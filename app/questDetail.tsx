import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { type Artwork, useArtworksByIds } from "@/src/hooks/useArtworksByIds";
import { type Quest, useQuests } from "@/src/hooks/useQuests";
import { type UserQuest, useUserQuests } from "@/src/hooks/useUserQuests";
import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";

interface QuestDetail {
  quest: Quest;
  userQuest: UserQuest | null;
  artworks: Artwork[];
}

export default function QuestDetailScreen() {
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

  useEffect(() => {
    const loadQuestDetail = async () => {
      try {
        // Get the quest data
        const quests = await getAllQuests();
        const quest = quests.find((q: Quest) => q.id === questId);
        if (!quest) {
          throw new Error("Quest not found");
        }

        // Get the user's progress on this quest
        const userQuest = await getUserQuestByQuestId(questId);

        // Get the artwork details
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
    };

    if (questId) {
      loadQuestDetail();
    }
  }, [questId, getAllQuests, getUserQuestByQuestId, getArtworksByIds]);

  const handleStartQuest = async () => {
    if (!questDetail?.quest) return;

    setIsStarting(true);
    try {
      const result = await startQuest(questDetail.quest);
      if (result) {
        // Update the local state with the new UserQuest
        setQuestDetail((prev) =>
          prev
            ? {
                ...prev,
                userQuest: result,
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

  // Show loading state
  if (isLoadingQuest || isLoadingUserQuest || isLoadingArtworks) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Loading quest details...</ThemedText>
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Quest Info Card */}
        <ThemedView style={styles.questCard}>
          <ThemedView style={styles.questHeader}>
            <ThemedView style={styles.headerLeft}>
              <ThemedView style={styles.iconContainer}>
                <FontAwesome
                  name={(quest.icon as any) || "search"}
                  size={24}
                  color={Colors.darkYellow}
                />
              </ThemedView>
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
                  },
                ]}
              />
            </ThemedView>
          )}

          {/* Progress Tracker - Only show if quest is started */}
          {userQuest ? (
            <ThemedView style={styles.progressTracker}>
              <ThemedView style={styles.progressLeft}>
                <FontAwesome
                  name="check-circle"
                  size={16}
                  color={Colors.darkGreen}
                  style={styles.checkIcon}
                />
                <ThemedText style={styles.progressText}>
                  {progress.current}/{progress.total} artworks discovered
                </ThemedText>
              </ThemedView>
              <ThemedView
                style={[
                  styles.statusBadge,
                  questStatus === "Completed" && styles.completedBadge,
                  questStatus === "In Progress" && styles.inProgressBadge,
                  questStatus === "Not Started" && styles.notStartedBadge,
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    questStatus === "Completed" && styles.completedText,
                    questStatus === "In Progress" && styles.inProgressText,
                    questStatus === "Not Started" && styles.notStartedText,
                  ]}
                >
                  {questStatus}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          ) : (
            /* Status Badge Only - When quest not started */
            <ThemedView style={styles.progressTracker}>
              <ThemedView style={styles.progressLeft}>
                {/* Empty space to push badge to the right */}
              </ThemedView>
              <ThemedView style={[styles.statusBadge, styles.notStartedBadge]}>
                <ThemedText style={[styles.statusText, styles.notStartedText]}>
                  {questStatus}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {/* Start Quest Button */}
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
    backgroundColor: Colors.lightGreen,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 12,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  xpText: {
    color: Colors.darkGreen,
    fontSize: 14,
  },
  description: {
    marginBottom: 16,
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
  notStartedBadge: {
    backgroundColor: Colors.medLightGray,
    borderWidth: 1,
    borderColor: Colors.darkMedGray,
  },
  notStartedText: {
    color: Colors.darkMedGray,
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
  startButtonText: {
    color: Colors.lightGray,
  },
});
