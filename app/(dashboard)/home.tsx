import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useArtworks, type Artwork } from "@/src/hooks/useArtworks";
import { useDepartments, type Department } from "@/src/hooks/useDepartments";
import { useDidYouKnow } from "@/src/hooks/useDidYouKnow";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { Colors } from "@/constants/Colors";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [featuredArtworks, setFeaturedArtworks] = useState<Artwork[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentDate, setCurrentDate] = useState("");
  const [randomFact, setRandomFact] = useState<string>("");
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const navigation = useNavigation();
  const {
    getFeaturedArtworks,
    isLoading: isLoadingArtworks,
    error: artworksError,
  } = useArtworks();
  const {
    getAllDepartments,
    isLoading: isLoadingDepartments,
    error: departmentsError,
  } = useDepartments();
  const {
    loadFacts,
    getRandomFact,
    isLoading: isLoadingFacts,
    error: factsError,
  } = useDidYouKnow();

  // Set current date on mount
  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    setCurrentDate(formattedDate);
  }, []);

  // Fetch featured artworks on mount
  useEffect(() => {
    const loadArtworks = async () => {
      const artworks = await getFeaturedArtworks();
      setFeaturedArtworks(artworks);
    };
    loadArtworks();
  }, [getFeaturedArtworks]);

  // Fetch departments on mount
  useEffect(() => {
    const loadDepartments = async () => {
      const fetchedDepartments = await getAllDepartments();
      setDepartments(fetchedDepartments);
    };
    loadDepartments();
  }, [getAllDepartments]);

  // Load facts and set random fact on mount
  useEffect(() => {
    const loadFactsAndSetRandom = async () => {
      await loadFacts();
      const fact = getRandomFact();
      if (fact) {
        setRandomFact(fact.fact);
      }
    };
    loadFactsAndSetRandom();
  }, [loadFacts, getRandomFact]);

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
  if (
    (isLoadingArtworks && featuredArtworks.length === 0) ||
    (isLoadingDepartments && departments.length === 0) ||
    (isLoadingFacts && randomFact === "")
  ) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // Show error state
  if (
    (artworksError && featuredArtworks.length === 0) ||
    (departmentsError && departments.length === 0) ||
    (factsError && randomFact === "")
  ) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>
          Error loading content:{" "}
          {artworksError?.message ||
            departmentsError?.message ||
            factsError?.message}
        </ThemedText>
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
        <ThemedText style={[{ color: Colors.metRed }, styles.headerTitle]}>
          AR
        </ThemedText>
        <ThemedText style={styles.headerTitle}>tifact</ThemedText>
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
                <FontAwesome
                  name="chevron-left"
                  size={20}
                  color={Colors.medGray}
                />
              </Pressable>
              <Pressable
                style={[styles.carouselButton, styles.carouselButtonRight]}
                onPress={handleNext}
              >
                <FontAwesome
                  name="chevron-right"
                  size={20}
                  color={Colors.medGray}
                />
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
          {departments.map((department) => (
            <Pressable
              key={department.id}
              style={styles.collectionItem}
              onPress={() => {
                router.push({
                  pathname: "/collection",
                  params: { id: department.id },
                });
              }}
            >
              <Image
                source={{ uri: department.coverImage || undefined }}
                style={styles.collectionImage}
              />
              <ThemedText style={styles.collectionTitle}>
                {department.displayName}
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
            <FontAwesome
              name="lightbulb-o"
              size={20}
              color={Colors.darkYellow}
            />
          </ThemedView>
          <ThemedView style={styles.triviaContent}>
            <ThemedText style={styles.triviaText}>
              {randomFact ||
                "Loading interesting facts about art and the museum..."}
            </ThemedText>
            <ThemedView style={styles.triviaFooter}>
              <FontAwesome
                name="clock-o"
                size={12}
                color={Colors.darkMedGray}
              />
              <ThemedText style={styles.triviaDate}>
                Daily Art Fact • {currentDate}
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
    backgroundColor: "white",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "bold",
    paddingTop: 20,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  lastSection: {
    marginBottom: 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 15,
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
    backgroundColor: Colors.lightGray,
    borderRadius: 15,
    shadowColor: "black",
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
    color: Colors.darkMedGray,
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
    backgroundColor: Colors.medGray,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "black",
  },
  collectionsContainer: {
    gap: 10,
  },
  collectionItem: {
    width: 200,
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
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
  },
  triviaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightYellow,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  triviaContent: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  triviaText: {
    fontSize: 14,
    lineHeight: 20,
  },
  triviaFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: Colors.lightGray,
  },
  triviaDate: {
    fontSize: 12,
    color: Colors.darkMedGray,
    marginLeft: 6,
  },
  carouselButton: {
    position: "absolute",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 5,
    zIndex: 1,
    top: 130,
    marginHorizontal: -15,
  },
  carouselButtonLeft: {
    left: 0,
  },
  carouselButtonRight: {
    right: 0,
  },
});
