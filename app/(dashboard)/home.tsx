import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useArtworks, type Artwork } from "@/src/hooks/useArtworks";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, router, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet } from "react-native";
import Carousel from "react-native-reanimated-carousel";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Collection {
  id: string;
  title: string;
  image: string;
}

const COLLECTIONS: Collection[] = [
  {
    id: "1",
    title: "American Decorative Arts",
    image:
      "https://www.metmuseum.org/-/media/images/about-the-met/collection-areas/american-wing/the-american-wing-court_teaser.jpg?sc_lang=en",
  },
  {
    id: "2",
    title: "Arms and Armor",
    image:
      "https://www.metmuseum.org/-/media/images/about-the-met/collection-areas/arms-and-armor/arms-and-armor_teaser.jpg",
  },
  {
    id: "3",
    title: "Asian Art",
    image:
      "https://collectionapi.metmuseum.org/api/collection/v1/iiif/78870/preview",
  },
  {
    id: "4",
    title: "The Costume Institute",
    image:
      "https://fashionista.com/.image/t_share/MTY4NjA4NDk0NTUzOTMzNDQ3/sandy-schreier-metropolitan-museum-of-art-costume-institute-exhibition-review.jpg",
  },
];

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [featuredArtworks, setFeaturedArtworks] = useState<Artwork[]>([]);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const navigation = useNavigation();
  const { getFeaturedArtworks, isLoading, error } = useArtworks();

  // Fetch featured artworks on mount
  useEffect(() => {
    const loadArtworks = async () => {
      const artworks = await getFeaturedArtworks();
      setFeaturedArtworks(artworks);
    };
    loadArtworks();
  }, [getFeaturedArtworks]);

  // Handle navigation focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setIsAutoPlaying(true);
    });

    return unsubscribe;
  }, [navigation]);

  const handleGestureStart = (event: any) => {
    touchStartX.current = event.nativeEvent.pageX;
    touchStartY.current = event.nativeEvent.pageY;
  };

  const handleGestureEnd = (event: any, artwork: Artwork) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = Math.abs(event.nativeEvent.pageX - touchStartX.current);
    const deltaY = Math.abs(event.nativeEvent.pageY - touchStartY.current);

    // If the gesture distance is small enough, consider it a tap
    const isATap = deltaX < 10 && deltaY < 10;

    if (isATap) {
      setIsAutoPlaying(false); // Pause autoplay when navigating away
      router.push({
        pathname: "/artDetail",
        params: {
          id: artwork.id,
          source: "Home",
        },
      });
    }

    // Reset touch tracking
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const carouselRef = useRef<any>(null);

  const handlePrevious = () => {
    if (carouselRef.current) {
      carouselRef.current.prev();
    }
  };

  const handleNext = () => {
    if (carouselRef.current) {
      carouselRef.current.next();
    }
  };

  const handleProgressChange = (_: number, absoluteProgress: number) => {
    const newIndex = Math.round(absoluteProgress) % featuredArtworks.length;
    setActiveIndex(newIndex);
  };

  const renderFeaturedItem = (item: Artwork) => (
    <Pressable
      onTouchStart={handleGestureStart}
      onTouchEnd={(e) => handleGestureEnd(e, item)}
      style={styles.featuredItem}
    >
      <Image
        source={{ uri: item.primaryImage || undefined }}
        style={styles.featuredImage}
      />
      <ThemedText style={styles.artworkTitle}>{item.title}</ThemedText>
      <ThemedText style={styles.artistName}>
        {item.artistDisplayName || "Unknown Artist"}
      </ThemedText>
    </Pressable>
  );

  const renderPagination = () => {
    return (
      <ThemedView style={styles.paginationContainer}>
        {featuredArtworks.map((_, index) => (
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

  // Show loading state
  if (isLoading && featuredArtworks.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Loading featured artworks...</ThemedText>
      </ThemedView>
    );
  }

  // Show error state
  if (error && featuredArtworks.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Error loading artworks: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>ARtifact</ThemedText>
        <Link href="/profile" asChild>
          <Pressable style={styles.profileIcon}>
            <FontAwesome name="user-circle" size={32} color="#666" />
          </Pressable>
        </Link>
      </ThemedView>

      {/* Featured Artworks */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Featured Artworks</ThemedText>
        <ThemedView style={styles.carouselContainer}>
          {featuredArtworks.length > 0 ? (
            <>
              <Carousel
                ref={carouselRef}
                loop
                width={SCREEN_WIDTH - 40}
                height={400}
                autoPlay={isAutoPlaying}
                data={featuredArtworks}
                scrollAnimationDuration={1000}
                autoPlayInterval={3000}
                onProgressChange={handleProgressChange}
                renderItem={({ item }) => renderFeaturedItem(item)}
                enabled={false}
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 0.9,
                  parallaxScrollingOffset: 40,
                }}
              />
              <Pressable
                style={[styles.carouselButton, styles.carouselButtonLeft]}
                onPress={handlePrevious}
              >
                <FontAwesome name="chevron-left" size={20} color="#666" />
              </Pressable>
              <Pressable
                style={[styles.carouselButton, styles.carouselButtonRight]}
                onPress={handleNext}
              >
                <FontAwesome name="chevron-right" size={20} color="#666" />
              </Pressable>
            </>
          ) : (
            <ThemedView style={styles.noArtworksContainer}>
              <ThemedText>No featured artworks available</ThemedText>
            </ThemedView>
          )}
          {renderPagination()}
        </ThemedView>
      </ThemedView>

      {/* Collections */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Collections</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.collectionsContainer}
        >
          {COLLECTIONS.map((collection) => (
            <Pressable
              key={collection.id}
              style={styles.collectionItem}
              onPress={() => {
                router.push({
                  pathname: "/collection",
                  params: { id: collection.id },
                });
              }}
            >
              <Image
                source={{ uri: collection.image }}
                style={styles.collectionImage}
              />
              <ThemedText style={styles.collectionTitle}>
                {collection.title}
              </ThemedText>
            </Pressable>
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileIcon: {
    padding: 5,
  },
  section: {
    marginTop: 20,
  },
  lastSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  carouselContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  noArtworksContainer: {
    width: SCREEN_WIDTH - 40,
    height: 400,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredItem: {
    width: SCREEN_WIDTH - 40,
    paddingHorizontal: 20,
  },
  featuredImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
  },
  artworkTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    paddingHorizontal: 15,
  },
  artistName: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 5,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000",
  },
  collectionsContainer: {
    paddingHorizontal: 15,
  },
  collectionItem: {
    width: 200,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  collectionImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    paddingHorizontal: 5,
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
  carouselButton: {
    position: "absolute",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 5,
    zIndex: 1,
    top: 130,
  },
  carouselButtonLeft: {
    left: 0,
  },
  carouselButtonRight: {
    right: 0,
  },
});
