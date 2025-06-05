import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { type Artwork, useArtworksByIds } from "@/src/hooks/useArtworksByIds";
import { useVisited } from "@/src/hooks/useVisited";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ARTWORK_WIDTH = (SCREEN_WIDTH - 64) / 2;

export default function ArtworksVisitedScreen() {
  const { getVisitedArtworks, isLoading: isLoadingVisited } = useVisited();
  const {
    getArtworksByIds,
    isLoading: isLoadingArtworks,
    error,
  } = useArtworksByIds();
  const [visitedArtworks, setVisitedArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    const loadVisitedArtworks = async () => {
      try {
        // Get visited records
        const visited = await getVisitedArtworks();

        // Sort by most recent first
        const sortedVisited = visited.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
        });

        // Get artwork details for each visited record
        const artworkIds = sortedVisited.map((v) => v.artworkId);
        const artworks = await getArtworksByIds(artworkIds);
        setVisitedArtworks(artworks);
      } catch (err) {
        console.error("Error loading visited artworks:", err);
      }
    };

    loadVisitedArtworks();
  }, [getVisitedArtworks, getArtworksByIds]);

  // Show loading state
  if (isLoadingVisited || isLoadingArtworks) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            title: "Artworks Visited",
            headerShadowVisible: false,
            headerBackTitle: "Profile",
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
            title: "Artworks Visited",
            headerShadowVisible: false,
            headerBackTitle: "Profile",
          }}
        />
        <ThemedText style={styles.errorText}>
          Error loading artworks: {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  // Show empty state
  if (visitedArtworks.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            title: "Artworks Visited",
            headerShadowVisible: false,
            headerBackTitle: "Profile",
          }}
        />
        <ThemedView style={styles.emptyState}>
          <FontAwesome name="eye" size={48} color="#f0f0f0" />
          <ThemedText style={styles.emptyStateTitle}>
            No Artworks Visited Yet
          </ThemedText>
          <ThemedText style={styles.emptyStateText}>
            Start exploring the museum to build your collection!
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Artworks Visited",
          headerShadowVisible: false,
          headerBackTitle: "Profile",
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.grid}>
          {visitedArtworks.map((artwork) => (
            <Pressable
              key={artwork.id}
              style={styles.artworkContainer}
              onPress={() => {
                router.push({
                  pathname: "/artDetail",
                  params: {
                    id: artwork.id,
                    source: "Artworks Visited",
                  },
                });
              }}
            >
              <ThemedView style={styles.imageContainer}>
                <Image
                  source={{
                    uri: artwork.primaryImageSmall || artwork.primaryImage,
                  }}
                  style={styles.image}
                  contentFit="cover"
                />
                <ThemedView style={styles.checkmarkContainer}>
                  <FontAwesome name="eye" size={12} color="#fff" />
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.title} numberOfLines={1}>
                {artwork.title}
              </ThemedText>
              <ThemedText style={styles.artist} numberOfLines={1}>
                {artwork.artistDisplayName || "Unknown Artist"}
              </ThemedText>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  artworkContainer: {
    width: ARTWORK_WIDTH,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  checkmarkContainer: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
  },
  artist: {
    fontSize: 12,
    color: "#666",
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
