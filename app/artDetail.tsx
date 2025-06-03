import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { type Artwork, useArtwork } from "@/src/hooks/useArtwork";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ArtDetailScreen() {
  const params = useLocalSearchParams();
  // Log all params to see what we're receiving
  console.log("Art Detail Screen - Received params:", params);

  const source = Array.isArray(params.source)
    ? params.source[0]
    : params.source || "Home";
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Log the extracted values
  console.log("Art Detail Screen - Extracted values:", { source, id });

  const { getArtworkById, isLoading, error } = useArtwork();
  const [artwork, setArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    console.log("Art Detail Screen - Effect running with id:", id);
    if (id) {
      getArtworkById(id)
        .then((result) => {
          console.log("Art Detail Screen - Got artwork result:", result);
          if (result) {
            setArtwork(result);
          } else {
            console.log("Art Detail Screen - No artwork found for id:", id);
          }
        })
        .catch((err) => {
          console.error("Art Detail Screen - Error fetching artwork:", err);
        });
    } else {
      console.log("Art Detail Screen - No ID provided");
    }
  }, [id, getArtworkById]);

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Loading artwork details...</ThemedText>
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Error loading artwork: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  // Show not found state
  if (!artwork) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Artwork not found. ID: {id}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: source,
          title: "Artwork Details",
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Artwork Image */}
        <ThemedView style={styles.imageContainer}>
          <Image
            source={{
              uri: artwork.primaryImage || undefined,
            }}
            style={styles.artworkImage}
            contentFit="cover"
          />
        </ThemedView>

        {/* Artwork Info */}
        <ThemedView style={styles.infoContainer}>
          {/* Title and Favorite Button */}
          <ThemedView style={styles.titleRow}>
            <ThemedView>
              <ThemedText style={styles.title}>{artwork.title}</ThemedText>
              <ThemedText style={styles.artist}>
                {artwork.artistDisplayName || "Unknown Artist"}
              </ThemedText>
              <ThemedText style={styles.period}>
                {artwork.objectDate}
              </ThemedText>
            </ThemedView>
            <Pressable style={styles.favoriteButton}>
              <FontAwesome name="heart-o" size={20} color="#666" />
            </Pressable>
          </ThemedView>

          {/* AR Button */}
          <Pressable style={styles.arButton}>
            <FontAwesome name="cube" size={18} color="#fff" />
            <ThemedText style={styles.arButtonText}>View in AR</ThemedText>
            <ThemedView style={styles.premiumBadge}>
              <ThemedText style={styles.premiumText}>Premium</ThemedText>
            </ThemedView>
          </Pressable>

          {/* Artwork Details */}
          <ThemedView style={styles.detailsContainer}>
            {artwork.medium && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Medium</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {artwork.medium}
                </ThemedText>
              </ThemedView>
            )}
            {artwork.dimensions && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Dimensions</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {artwork.dimensions}
                </ThemedText>
              </ThemedView>
            )}
            {artwork.galleryNumber && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>
                  Gallery Location
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  Gallery {artwork.galleryNumber}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {/* Description */}
          {artwork.description && (
            <ThemedText style={styles.description}>
              {artwork.description}
            </ThemedText>
          )}

          {/* Audio Guide */}
          {artwork.hasAudio && (
            <ThemedView style={styles.audioGuideCard}>
              <ThemedView style={styles.audioGuideContent}>
                <Image
                  source={{
                    uri: "https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=123",
                  }}
                  style={styles.guideImage}
                />
                <ThemedView style={styles.guideInfo}>
                  <ThemedText style={styles.guideTitle}>Audio Guide</ThemedText>
                  <ThemedText style={styles.guideDuration}>
                    5 minutes
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.audioControls}>
                  <Pressable style={styles.transcriptButton}>
                    <FontAwesome name="file-text-o" size={18} color="#666" />
                  </Pressable>
                  <Pressable style={styles.playButton}>
                    <FontAwesome name="play" size={14} color="#fff" />
                  </Pressable>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    height: 300,
    backgroundColor: "#f5f5f5",
  },
  artworkImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    padding: 24,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  artist: {
    fontSize: 16,
    color: "#444",
    marginBottom: 2,
  },
  period: {
    fontSize: 14,
    color: "#666",
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  arButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  arButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  premiumBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#111",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  premiumText: {
    color: "#fff",
    fontSize: 12,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    color: "#111",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
  audioGuideCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  audioGuideContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
  },
  guideInfo: {
    flex: 1,
    marginLeft: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
  },
  guideDuration: {
    fontSize: 12,
    color: "#666",
  },
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transcriptButton: {
    padding: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
