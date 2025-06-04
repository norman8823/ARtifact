import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { type Artwork, useArtworksByIds } from "@/src/hooks/useArtworksByIds";
import { type Quest, useQuests } from "@/src/hooks/useQuests";
import { type UserQuest, useUserQuest } from "@/src/hooks/useUserQuest";
import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet } from "react-native";

interface QuestDetail {
  quest: Quest;
  userQuest: UserQuest | null;
  artworks: Artwork[];
}

export default function QuestDetailScreen() {
  const params = useLocalSearchParams();
  const questId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { getAllQuests, isLoading: isLoadingQuest } = useQuests();
  const { getUserQuestStatus, isLoading: isLoadingUserQuest } = useUserQuest();
  const { getArtworksByIds, isLoading: isLoadingArtworks } = useArtworksByIds();

  const [questDetail, setQuestDetail] = useState<QuestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const userQuest = await getUserQuestStatus(questId);

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
  }, [questId, getAllQuests, getUserQuestStatus, getArtworksByIds]);

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
        current: userQuest.progress.visitedArtworks.length,
        total: userQuest.progress.totalArtworks,
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
                <FontAwesome name="paint-brush" size={24} color="#F59E0B" />
              </ThemedView>
              <ThemedView>
                <ThemedText style={styles.questTitle}>{quest.title}</ThemedText>
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.xpBadge}>
              <ThemedText style={styles.xpText}>{quest.xpReward} XP</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText style={styles.description}>
            {quest.description}
          </ThemedText>

          {/* Progress Bar */}
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

          {/* Progress Tracker */}
          <ThemedView style={styles.progressTracker}>
            <ThemedView style={styles.progressLeft}>
              <FontAwesome
                name="check-circle"
                size={16}
                color="#22C55E"
                style={styles.checkIcon}
              />
              <ThemedText style={styles.progressText}>
                <ThemedText style={styles.progressCount}>
                  {progress.current}/{progress.total}
                </ThemedText>{" "}
                artworks discovered
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
        </ThemedView>

        {/* Artworks Section */}
        <ThemedView style={styles.artworksSection}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              Artworks to Discover
            </ThemedText>
            {quest.galleryMap && (
              <Pressable style={styles.mapButton}>
                <FontAwesome name="map-marker" size={14} color="#666666" />
                <ThemedText style={styles.mapButtonText}>
                  View on Map
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>

          {/* Artwork Cards */}
          {artworks.map((artwork) => (
            <Pressable
              key={artwork.id}
              style={[
                styles.artworkCard,
                userQuest?.progress.visitedArtworks.includes(artwork.id) &&
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
              <ThemedView style={styles.artworkContent}>
                {/* Artwork Image or Placeholder */}
                <ThemedView style={styles.artworkImage}>
                  {artwork.primaryImageSmall ? (
                    <Image
                      source={{ uri: artwork.primaryImageSmall }}
                      style={styles.image}
                    />
                  ) : (
                    <ThemedView style={styles.imagePlaceholder}>
                      <FontAwesome name="image" size={24} color="#9CA3AF" />
                    </ThemedView>
                  )}
                </ThemedView>

                {/* Artwork Info */}
                <ThemedView style={styles.artworkInfo}>
                  <ThemedView style={styles.artworkHeader}>
                    <ThemedText
                      style={[
                        styles.artworkTitle,
                        !userQuest?.progress.visitedArtworks.includes(
                          artwork.id
                        ) && styles.artworkTitleGray,
                      ]}
                    >
                      {artwork.title}
                    </ThemedText>
                    <ThemedView
                      style={[
                        styles.visitedBadge,
                        !userQuest?.progress.visitedArtworks.includes(
                          artwork.id
                        ) && styles.notVisitedBadge,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.visitedText,
                          !userQuest?.progress.visitedArtworks.includes(
                            artwork.id
                          ) && styles.notVisitedText,
                        ]}
                      >
                        {userQuest?.progress.visitedArtworks.includes(
                          artwork.id
                        )
                          ? "Visited"
                          : "Not Visited"}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <ThemedText style={styles.artworkDetails}>
                    {artwork.artistDisplayName || "Unknown Artist"} •{" "}
                    {artwork.medium || "Unknown Medium"}
                  </ThemedText>
                  {artwork.galleryNumber && (
                    <ThemedView style={styles.locationInfo}>
                      <FontAwesome
                        name="map-marker"
                        size={12}
                        color="#666666"
                      />
                      <ThemedText style={styles.locationText}>
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
    backgroundColor: "#FFFFFF",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  questCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  questTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 28,
  },
  xpBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 12,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  xpText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 16,
  },
  progressBar: {
    height: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 8,
  },
  progressTracker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  progressLeft: {
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    marginRight: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#4B5563",
  },
  progressCount: {
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  artworksSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
  },
  mapButtonText: {
    color: "#666666",
    fontSize: 14,
  },
  artworkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderLeftWidth: 4,
    borderLeftColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    padding: 12,
  },
  artworkCardVisited: {
    borderLeftColor: "#059669",
  },
  artworkContent: {
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
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  artworkInfo: {
    flex: 1,
    justifyContent: "center",
  },
  artworkHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    lineHeight: 22,
  },
  artworkTitleGray: {
    color: "#4B5563",
  },
  visitedBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  visitedText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "500",
  },
  notVisitedBadge: {
    backgroundColor: "#F3F4F6",
  },
  notVisitedText: {
    color: "#374151",
  },
  artworkDetails: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#666666",
  },
  completedBadge: {
    backgroundColor: "#ECFDF5",
  },
  completedText: {
    color: "#059669",
  },
  inProgressBadge: {
    backgroundColor: "#FEF3C7",
  },
  inProgressText: {
    color: "#D97706",
  },
});
