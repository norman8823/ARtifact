import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ArtDetailScreen() {
  const params = useLocalSearchParams();
  const source = Array.isArray(params.source)
    ? params.source[0]
    : params.source || "Home";

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
              uri: "https://upload.wikimedia.org/wikipedia/commons/2/21/Venus_de_Milo_Louvre_Ma399_n4.jpg",
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
              <ThemedText style={styles.title}>Venus de Milo</ThemedText>
              <ThemedText style={styles.artist}>
                Alexandros of Antioch
              </ThemedText>
              <ThemedText style={styles.period}>c. 130-100 BCE</ThemedText>
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
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Medium</ThemedText>
              <ThemedText style={styles.detailValue}>Parian marble</ThemedText>
            </ThemedView>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Dimensions</ThemedText>
              <ThemedText style={styles.detailValue}>
                203 cm × 130 cm
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>
                Gallery Location
              </ThemedText>
              <ThemedText style={styles.detailValue}>Gallery 234</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Description */}
          <ThemedText style={styles.description}>
            One of the most famous works of ancient Greek sculpture, the Venus
            de Milo depicts Aphrodite, the Greek goddess of love and beauty.
            Despite its significant damage, it is renowned for its beauty and
            mystery.
          </ThemedText>

          {/* Audio Guide */}
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
                <ThemedText style={styles.guideDuration}>5 minutes</ThemedText>
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
