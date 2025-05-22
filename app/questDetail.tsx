import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet } from "react-native";

interface Artwork {
  id: string;
  title: string;
  artist: string;
  medium: string;
  location: string;
  image?: string;
  isVisited: boolean;
}

interface QuestDetail {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: {
    current: number;
    total: number;
  };
  artworks: Artwork[];
}

export default function QuestDetailScreen() {
  const params = useLocalSearchParams();
  const [questDetail] = useState<QuestDetail>({
    id: "1",
    title: "Mixed Media",
    description:
      "Experience 5 different art mediums across our museum collections. Discover the versatility of artistic expression through various materials and techniques.",
    xpReward: 400,
    progress: {
      current: 2,
      total: 5,
    },
    artworks: [
      {
        id: "1",
        title: "Water Lilies",
        artist: "Claude Monet",
        medium: "Oil Painting",
        location: "Gallery 2, West Wing",
        image:
          "https://storage.googleapis.com/uxpilot-auth.appspot.com/29a4cd6a83-47f62d7ca0365b8fff72.png",
        isVisited: true,
      },
      {
        id: "2",
        title: "Dynamic Figure",
        artist: "Alberto Giacometti",
        medium: "Bronze Sculpture",
        location: "Gallery 4, Sculpture Hall",
        image:
          "https://storage.googleapis.com/uxpilot-auth.appspot.com/525b7ce496-e00819d9abf215db29d4.png",
        isVisited: true,
      },
      {
        id: "3",
        title: "Starry Night",
        artist: "Vincent van Gogh",
        medium: "Watercolor",
        location: "Gallery 3, East Wing",
        isVisited: false,
      },
      {
        id: "4",
        title: "The Persistence of Memory",
        artist: "Salvador Dalí",
        medium: "Mixed Media",
        location: "Gallery 5, Surrealism Hall",
        isVisited: false,
      },
      {
        id: "5",
        title: "Guernica",
        artist: "Pablo Picasso",
        medium: "Charcoal Drawing",
        location: "Gallery 1, Modern Art",
        isVisited: false,
      },
    ],
  });

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
                <ThemedText style={styles.questTitle}>
                  {questDetail.title}
                </ThemedText>
                <ThemedView style={styles.xpBadge}>
                  <ThemedText style={styles.xpText}>
                    {questDetail.xpReward} XP
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedText style={styles.description}>
            {questDetail.description}
          </ThemedText>

          {/* Progress Bar */}
          <ThemedView style={styles.progressBar}>
            <ThemedView
              style={[
                styles.progressFill,
                {
                  width: `${
                    (questDetail.progress.current /
                      questDetail.progress.total) *
                    100
                  }%`,
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
                  {questDetail.progress.current}/{questDetail.progress.total}
                </ThemedText>{" "}
                artworks discovered
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.statusBadge}>
              <ThemedText style={styles.statusText}>In Progress</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Artworks Section */}
        <ThemedView style={styles.artworksSection}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              Artworks to Discover
            </ThemedText>
            <Pressable style={styles.mapButton}>
              <FontAwesome name="map-marker" size={14} color="#666666" />
              <ThemedText style={styles.mapButtonText}>View on Map</ThemedText>
            </Pressable>
          </ThemedView>

          {/* Artwork Cards */}
          {questDetail.artworks.map((artwork) => (
            <Pressable
              key={artwork.id}
              style={[
                styles.artworkCard,
                artwork.isVisited && styles.artworkCardVisited,
              ]}
              onPress={() => {
                router.push({
                  pathname: "/artDetail",
                  params: {
                    id: artwork.id,
                    from: "questDetail",
                  },
                });
              }}
            >
              <ThemedView style={styles.artworkContent}>
                {/* Artwork Image or Placeholder */}
                <ThemedView style={styles.artworkImage}>
                  {artwork.image ? (
                    <Image
                      source={{ uri: artwork.image }}
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
                        !artwork.isVisited && styles.artworkTitleGray,
                      ]}
                    >
                      {artwork.title}
                    </ThemedText>
                    <ThemedView
                      style={[
                        styles.visitedBadge,
                        !artwork.isVisited && styles.notVisitedBadge,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.visitedText,
                          !artwork.isVisited && styles.notVisitedText,
                        ]}
                      >
                        {artwork.isVisited ? "Visited" : "Not Visited"}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <ThemedText style={styles.artworkDetails}>
                    {artwork.artist} • {artwork.medium}
                  </ThemedText>
                  <ThemedView style={styles.locationInfo}>
                    <FontAwesome name="map-marker" size={12} color="#666666" />
                    <ThemedText style={styles.locationText}>
                      {artwork.location}
                    </ThemedText>
                  </ThemedView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
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
    marginBottom: 4,
  },
  xpBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
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
    gap: 16,
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
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderLeftWidth: 4,
    borderLeftColor: "#E5E7EB",
  },
  artworkCardVisited: {
    borderLeftColor: "#059669",
  },
  artworkContent: {
    flexDirection: "row",
    gap: 12,
  },
  artworkImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
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
  },
  artworkHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  artworkTitleGray: {
    color: "#4B5563",
  },
  visitedBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
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
});
