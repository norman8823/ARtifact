import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { QuestArtworkThumbnails } from "@/components/QuestArtworkThumbnails";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { useArtworks, type Artwork } from "@/src/hooks/useArtworks";
import { useDepartments, type Department } from "@/src/hooks/useDepartments";
import { useDidYouKnow } from "@/src/hooks/useDidYouKnow";
import { useQuests, type Quest } from "@/src/hooks/useQuests";
import { useUserQuests } from "@/src/hooks/useUserQuests";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomeScreen() {
  const { isAuthReady, isAuthenticated } = useAuthContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [featuredArtworks, setFeaturedArtworks] = useState<Artwork[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentDate, setCurrentDate] = useState("");
  const [randomFact, setRandomFact] = useState<string>("");
  const [featuredQuest, setFeaturedQuest] = useState<Quest | null>(null);
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<any[]>([]);
  const [isFeaturedQuestPressed, setIsFeaturedQuestPressed] = useState(false);
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
  const {
    getAllQuests,
    isLoading: isLoadingQuests,
    error: questsError,
  } = useQuests();
  const {
    getUserQuests,
    isLoading: isLoadingUserQuests,
    error: userQuestsError,
  } = useUserQuests();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      router.replace("/");
    }
  }, [isAuthReady, isAuthenticated]);

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

  // Fetch featured artworks - wait for auth first
  useEffect(() => {
    if (!isAuthReady) return;

    const loadArtworks = async () => {
      const artworks = await getFeaturedArtworks();
      setFeaturedArtworks(artworks);
    };
    loadArtworks();
  }, [isAuthReady, getFeaturedArtworks]);

  // Fetch departments - wait for auth first
  useEffect(() => {
    if (!isAuthReady) return;

    const loadDepartments = async () => {
      const fetchedDepartments = await getAllDepartments();
      setDepartments(fetchedDepartments);
    };
    loadDepartments();
  }, [isAuthReady, getAllDepartments]);

  // Load facts - wait for auth first
  useEffect(() => {
    if (!isAuthReady) return;

    const loadFactsAndSetRandom = async () => {
      await loadFacts();
    };
    loadFactsAndSetRandom();
  }, [isAuthReady, loadFacts]);

  // Set random fact when facts are loaded
  useEffect(() => {
    if (randomFact === "") {
      // Only set if we don't have a fact yet
      const fact = getRandomFact();
      if (fact) {
        setRandomFact(fact.fact);
      }
    }
  }, [getRandomFact, randomFact]);

  // Load quests data - wait for auth first
  useEffect(() => {
    if (!isAuthReady) return;

    const loadQuestsData = async () => {
      try {
        const [questsData, userQuestsData] = await Promise.all([
          getAllQuests(),
          getUserQuests()
        ]);
        setAllQuests(questsData);
        setUserQuests(userQuestsData);
      } catch (error) {
        console.error("Error loading quests data:", error);
      }
    };

    loadQuestsData();
  }, [isAuthReady, getAllQuests, getUserQuests]);

  // Stable quest selection using useMemo
  const stableFeaturedQuest = useMemo(() => {
    if (allQuests.length === 0) return null;

    // Get completed quest IDs
    const completedQuestIds = new Set(
      userQuests
        .filter(uq => uq.status === 'completed')
        .map(uq => uq.questId)
    );

    // Filter available quests (not completed)
    const availableQuests = allQuests.filter(
      quest => !completedQuestIds.has(quest.id)
    );

    // Select a quest, prioritizing available ones
    const questsToChooseFrom = availableQuests.length > 0 ? availableQuests : allQuests;
    if (questsToChooseFrom.length > 0) {
      // Use a deterministic selection based on the current date
      // This will give a different quest each day but remain stable during the day
      const today = new Date().toDateString();
      const seed = today.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const index = Math.abs(seed) % questsToChooseFrom.length;
      return questsToChooseFrom[index];
    }
    return null;
  }, [allQuests, userQuests]);

  // Update featured quest when stable selection changes
  useEffect(() => {
    if (stableFeaturedQuest && stableFeaturedQuest !== featuredQuest) {
      setFeaturedQuest(stableFeaturedQuest);
    }
  }, [stableFeaturedQuest, featuredQuest]);

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
        key={item.id}
        source={{ uri: item.primaryImage }}
        style={styles.featuredImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <ThemedText type="subtitle" style={styles.artworkTitle}>
        {item.title}
      </ThemedText>
      <ThemedText type="subtitle" style={styles.artistName}>
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

  // Show loading state (including auth initialization)
  if (
    !isAuthReady ||
    (isLoadingArtworks && featuredArtworks.length === 0) ||
    (isLoadingDepartments && departments.length === 0) ||
    (isLoadingFacts && randomFact === "") ||
    (isLoadingQuests && allQuests.length === 0)
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
    (factsError && randomFact === "") ||
    (questsError && allQuests.length === 0)
  ) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>
          Error loading content:{" "}
          {artworksError?.message ||
            departmentsError?.message ||
            factsError?.message ||
            questsError?.message}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header */}
          <ThemedView style={styles.header}>
            <Image
              source={require("@/assets/images/Color logo - no background.png")}
              style={styles.headerLogo}
              contentFit="contain"
            />
          </ThemedView>

          {/* Featured Artworks */}
          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Featured Artworks
            </ThemedText>
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
                    windowSize={5}
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
            <ThemedText type="title" style={styles.sectionTitle}>
              Collections
            </ThemedText>
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
                  <ThemedText type="subtitle" style={styles.collectionTitle}>
                    {department.displayName}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>

          {/* Featured Quest */}
          {featuredQuest && (
            <ThemedView style={styles.section}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Featured Quest
              </ThemedText>
              <Pressable
                style={[
                  styles.featuredQuestCard,
                  isFeaturedQuestPressed && styles.featuredQuestCardPressed,
                ]}
                onPressIn={() => setIsFeaturedQuestPressed(true)}
                onPressOut={() => setIsFeaturedQuestPressed(false)}
                onPress={() => {
                  router.push({
                    pathname: "/questDetail",
                    params: { id: featuredQuest.id },
                  });
                }}
              >
                <ThemedView style={styles.questHeader}>
                  <ThemedView style={styles.questInfo}>
                    <ThemedView style={styles.titleRow}>
                      <ThemedText type="title" style={styles.questTitle}>
                        {featuredQuest.title}
                      </ThemedText>
                      {featuredQuest.isPremium && (
                        <ThemedView style={styles.premiumBadge}>
                          <ThemedText style={styles.premiumText}>Premium</ThemedText>
                        </ThemedView>
                      )}
                      <ThemedView style={styles.xpBadge}>
                        <ThemedText style={styles.xpText}>{featuredQuest.xpReward} XP</ThemedText>
                      </ThemedView>
                    </ThemedView>
                    {featuredQuest.artworkThumbnails && featuredQuest.artworkThumbnails.length > 0 && (
                      <QuestArtworkThumbnails
                        artworks={featuredQuest.artworkThumbnails}
                        visitedArtworkIds={[]}
                      />
                    )}
                  </ThemedView>
                </ThemedView>
                {featuredQuest.description && (
                  <ThemedView style={styles.descriptionContainer}>
                    <ThemedText style={styles.descriptionText}>{featuredQuest.description}</ThemedText>
                  </ThemedView>
                )}
              </Pressable>
            </ThemedView>
          )}

          {/* Did You Know */}
          <ThemedView style={[styles.section, styles.didYouKnowSection]}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Did You Know?
            </ThemedText>
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
                    color={Colors.medGray}
                  />
                  <ThemedText style={styles.triviaDate}>
                    Daily Art Fact • {currentDate}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </>
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
  contentContainer: {
    paddingBottom: 80,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    marginBottom: 12,
  },
  headerLogo: {
    width: "100%",
    height: 80,
    maxWidth: 400,
  },
  section: {
    marginTop: 36,
    marginHorizontal: 20,
  },
  lastSection: {
    marginBottom: 80,
  },
  didYouKnowSection: {
    marginTop: 56,
    marginBottom: 36,
  },
  sectionTitle: {
    marginBottom: 16,
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
    borderRadius: 12,
    ...shadowStyle,
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
    marginTop: 12,
  },
  artistName: {
    fontSize: 14,
    color: Colors.darkMedGray,
    marginTop: 6,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
    marginTop: 8,
  },
  triviaCard: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    ...shadowStyle,
  },
  triviaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightYellow,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderColor: Colors.darkYellow,
    borderWidth: 1,
  },
  triviaContent: {
    flex: 1,
    backgroundColor: Colors.medLightGray,
  },
  triviaText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.darkMedGray,
  },
  triviaFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: Colors.medLightGray,
  },
  triviaDate: {
    fontSize: 12,
    color: Colors.medGray,
    marginLeft: 6,
  },
  carouselButton: {
    position: "absolute",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
  featuredQuestCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 16,
    ...shadowStyle,
  },
  questHeader: {
    marginBottom: 8,
    backgroundColor: "#f7f7f7",
  },
  questInfo: {
    gap: 8,
    backgroundColor: "#f7f7f7",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f7f7f7",
  },
  questTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  xpBadge: {
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.darkMedGray,
  },
  premiumBadge: {
    backgroundColor: Colors.darkYellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.lightGray,
  },
  descriptionContainer: {
    marginTop: 4,
    backgroundColor: "#f7f7f7",
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.darkMedGray,
  },
  featuredQuestCardPressed: {
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: -1, height: -1 },
    elevation: 0,
    transform: [{ translateY: 1 }],
  },
});
