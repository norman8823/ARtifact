import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet } from "react-native";
import Carousel from "react-native-reanimated-carousel";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Artwork {
  id: number;
  title: string;
  artist: string;
  image: string;
}

interface Collection {
  id: number;
  title: string;
  image: string;
}

const FEATURED_ARTWORKS: Artwork[] = [
  {
    id: 1,
    title: "The Starry Night",
    artist: "Vincent van Gogh",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/500px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
  },
  {
    id: 2,
    title: "The Persistence of Memory",
    artist: "Salvador Dalí",
    image:
      "https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg",
  },
  {
    id: 3,
    title: "The Scream",
    artist: "Edvard Munch",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg",
  },
];

const COLLECTIONS: Collection[] = [
  {
    id: 1,
    title: "American Decorative Arts",
    image:
      "https://www.metmuseum.org/-/media/images/about-the-met/collection-areas/american-wing/the-american-wing-court_teaser.jpg?sc_lang=en",
  },
  {
    id: 2,
    title: "Arms and Armor",
    image:
      "https://www.metmuseum.org/-/media/images/about-the-met/collection-areas/arms-and-armor/arms-and-armor_teaser.jpg",
  },
  {
    id: 3,
    title: "Asian Art",
    image:
      "https://collectionapi.metmuseum.org/api/collection/v1/iiif/78870/preview",
  },
  {
    id: 4,
    title: "The Costume Institute",
    image:
      "https://fashionista.com/.image/t_share/MTY4NjA4NDk0NTUzOTMzNDQ3/sandy-schreier-metropolitan-museum-of-art-costume-institute-exhibition-review.jpg",
  },
];

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleGestureStart = (event: any) => {
    touchStartX.current = event.nativeEvent.pageX;
    touchStartY.current = event.nativeEvent.pageY;
  };

  const handleGestureEnd = (event: any) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = Math.abs(event.nativeEvent.pageX - touchStartX.current);
    const deltaY = Math.abs(event.nativeEvent.pageY - touchStartY.current);

    // If the gesture distance is small enough, consider it a tap
    const isATap = deltaX < 10 && deltaY < 10;

    if (isATap) {
      router.push("/artDetail");
    }

    // Reset touch tracking
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const renderFeaturedItem = (item: Artwork) => (
    <Pressable
      onTouchStart={handleGestureStart}
      onTouchEnd={handleGestureEnd}
      style={styles.featuredItem}
    >
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <ThemedText style={styles.artworkTitle}>{item.title}</ThemedText>
      <ThemedText style={styles.artistName}>{item.artist}</ThemedText>
    </Pressable>
  );

  const renderPagination = () => {
    return (
      <ThemedView style={styles.paginationContainer}>
        {FEATURED_ARTWORKS.map((_, index) => (
          <ThemedView
            key={index}
            style={[
              styles.paginationDot,
              index === activeIndex ? styles.paginationDotActive : null,
            ]}
          />
        ))}
      </ThemedView>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Artifact</ThemedText>
        <Link href="/profile" asChild>
          <Pressable style={styles.profileIcon}>
            <FontAwesome name="user-circle" size={32} color="#666" />
          </Pressable>
        </Link>
      </ThemedView>

      {/* Featured Artworks */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Featured Artworks</ThemedText>
        <Carousel
          loop
          width={SCREEN_WIDTH - 40}
          height={400}
          autoPlay={true}
          data={FEATURED_ARTWORKS}
          scrollAnimationDuration={2000}
          autoPlayInterval={4000}
          onProgressChange={(_, absoluteProgress) =>
            setActiveIndex(Math.round(absoluteProgress))
          }
          renderItem={({ item }) => renderFeaturedItem(item)}
        />
        {renderPagination()}
      </ThemedView>

      {/* Browse Collections */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Browse Collections</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {COLLECTIONS.map((collection) => (
            <Link key={collection.id} href="/collection" asChild>
              <Pressable style={styles.collectionItem}>
                <Image
                  source={{ uri: collection.image }}
                  style={styles.collectionImage}
                />
                <ThemedText style={styles.collectionTitle}>
                  {collection.title}
                </ThemedText>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Did You Know */}
      <ThemedView style={[styles.section, styles.lastSection]}>
        <ThemedText style={styles.sectionTitle}>Did You Know?</ThemedText>
        <ThemedView style={styles.triviaCard}>
          <ThemedView style={styles.triviaIconContainer}>
            <FontAwesome name="lightbulb-o" size={20} color="#fff" />
          </ThemedView>
          <ThemedView style={styles.triviaContent}>
            <ThemedText style={styles.triviaText}>
              Leonardo da Vinci's Mona Lisa is actually painted on a poplar wood
              panel, not canvas. The painting is also smaller than most people
              expect, measuring just 30 × 21 inches.
            </ThemedText>
            <ThemedView style={styles.triviaFooter}>
              <FontAwesome name="clock-o" size={12} color="#666" />
              <ThemedText style={styles.triviaDate}>
                Daily Art Fact • May 13, 2025
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Add extra padding at the bottom for tab bar
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 40, // Extra margin for the last section
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  featuredItem: {
    width: SCREEN_WIDTH - 80,
    marginHorizontal: 20,
  },
  featuredImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  artistName: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#007AFF",
  },
  collectionItem: {
    marginRight: 16,
    width: (SCREEN_WIDTH - 56) / 2,
  },
  collectionImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  collectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  triviaCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
  },
  triviaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  triviaContent: {
    flex: 1,
  },
  triviaText: {
    fontSize: 14,
    lineHeight: 20,
  },
  triviaFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  triviaDate: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
});
