import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useFavoritesContext } from "@/src/contexts/FavoritesContext";
import { type ArtFact, useArtFacts } from "@/src/hooks/useArtFacts";
import { type Artwork, useArtwork } from "@/src/hooks/useArtwork";
import { useFavorites } from "@/src/hooks/useFavorites";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;
const THUMBNAIL_SIZE = 60;
const THUMBNAIL_SPACING = 8;
const CARD_PADDING = 36;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;

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

  const {
    getArtworkById,
    isLoading: isLoadingArtwork,
    error: artworkError,
  } = useArtwork();
  const {
    getArtFactsByArtworkId,
    isLoading: isLoadingFacts,
    error: factsError,
  } = useArtFacts();
  const { checkIfFavorited, toggleFavorite } = useFavorites();
  const { triggerRefresh } = useFavoritesContext();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [artFacts, setArtFacts] = useState<ArtFact[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedOffsetX = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);
  const [activeFactIndex, setActiveFactIndex] = useState(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Reset if scale is less than 1
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        offsetX.value = withSpring(0);
        offsetY.value = withSpring(0);
        savedOffsetX.value = 0;
        savedOffsetY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        offsetX.value = savedOffsetX.value + e.translationX;
        offsetY.value = savedOffsetY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  const resetZoom = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    offsetX.value = withSpring(0);
    offsetY.value = withSpring(0);
    savedOffsetX.value = 0;
    savedOffsetY.value = 0;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const [artworkResult, facts] = await Promise.all([
          getArtworkById(id),
          getArtFactsByArtworkId(id),
        ]);

        if (artworkResult) {
          setArtwork(artworkResult);
          setSelectedImage(artworkResult.primaryImage);

          // Check if the artwork is favorited
          const favorite = await checkIfFavorited(id);
          setIsFavorited(!!favorite);
        }

        // Ensure facts match our ArtFact interface
        const validFacts: ArtFact[] = facts.map((fact) => ({
          id: fact.id,
          artworkId: fact.artworkId,
          content: fact.content || null,
          isActive: fact.isActive || null,
          timestamp: fact.timestamp || null,
        }));
        setArtFacts(validFacts);
      } catch (err) {
        console.error("Error loading artwork data:", err);
      }
    };

    loadData();
  }, [id, getArtworkById, getArtFactsByArtworkId, checkIfFavorited]);

  const handleToggleFavorite = async () => {
    if (isTogglingFavorite || !artwork) return;

    setIsTogglingFavorite(true);
    try {
      const newFavoritedState = await toggleFavorite(artwork.id);
      setIsFavorited(newFavoritedState);
      triggerRefresh(); // Trigger refresh after successful toggle
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Show loading state
  if (isLoadingArtwork || isLoadingFacts) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Loading artwork details...</ThemedText>
      </ThemedView>
    );
  }

  // Show error state
  if (artworkError || factsError) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>
          Error loading artwork: {artworkError?.message || factsError?.message}
        </ThemedText>
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

  // Combine primary image with additional images for the gallery
  const allImages = [
    artwork.primaryImage,
    ...(artwork.additionalImages || []),
  ].filter((img): img is string => !!img);

  const renderThumbnail = ({ item: imageUrl }: { item: string }) => (
    <Pressable
      style={[
        styles.thumbnail,
        selectedImage === imageUrl && styles.thumbnailSelected,
      ]}
      onPress={() => setSelectedImage(imageUrl)}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.thumbnailImage}
        contentFit="cover"
      />
    </Pressable>
  );

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
          <ThemedView style={styles.mainImageContainer}>
            <Image
              source={{
                uri: selectedImage || artwork.primaryImage || undefined,
              }}
              style={styles.artworkImage}
              contentFit="cover"
            />
            <Pressable
              style={styles.zoomButton}
              onPress={() => setIsModalVisible(true)}
            >
              <FontAwesome name="search-plus" size={24} color="#fff" />
            </Pressable>
          </ThemedView>
          {allImages.length > 1 && (
            <FlatList
              data={allImages}
              renderItem={renderThumbnail}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.thumbnailContainer,
                allImages.length * (THUMBNAIL_SIZE + THUMBNAIL_SPACING) <
                  SCREEN_WIDTH && styles.thumbnailContainerCentered,
              ]}
            />
          )}
        </ThemedView>

        {/* Full Image Modal */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            resetZoom();
            setIsModalVisible(false);
          }}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemedView style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  resetZoom();
                  setIsModalVisible(false);
                }}
              >
                <FontAwesome name="times" size={24} color="#fff" />
              </TouchableOpacity>
              <GestureDetector gesture={composed}>
                <Animated.View
                  style={[styles.modalImageContainer, animatedStyle]}
                >
                  <Image
                    source={{
                      uri: selectedImage || artwork.primaryImage || undefined,
                    }}
                    style={styles.modalImage}
                    contentFit="contain"
                  />
                </Animated.View>
              </GestureDetector>
            </ThemedView>
          </GestureHandlerRootView>
        </Modal>

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
            <Pressable
              style={styles.favoriteButton}
              onPress={handleToggleFavorite}
              disabled={isTogglingFavorite}
            >
              <FontAwesome
                name={isFavorited ? "heart" : "heart-o"}
                size={20}
                color={isFavorited ? "#ff4444" : "#666"}
              />
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

          {/* Did You Know Section */}
          {artFacts.length > 0 && (
            <ThemedView style={styles.didYouKnowContainer}>
              <ThemedView style={styles.didYouKnowBorder} />
              <ThemedView style={styles.didYouKnowTitleContainer}>
                <ThemedView style={styles.didYouKnowTitleBackground}>
                  <ThemedText style={styles.didYouKnowTitle}>
                    Did You Know?
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <FlatList<ArtFact>
                data={artFacts}
                horizontal
                pagingEnabled
                snapToInterval={CARD_WIDTH + 8}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                contentContainerStyle={[
                  styles.factsContainer,
                  { width: (CARD_WIDTH + 8) * artFacts.length - 8 },
                ]}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.min(
                    Math.max(
                      0,
                      Math.round(
                        event.nativeEvent.contentOffset.x / (CARD_WIDTH + 8)
                      )
                    ),
                    artFacts.length - 1
                  );
                  setActiveFactIndex(newIndex);
                }}
                renderItem={({ item }: { item: ArtFact }) => (
                  <ThemedView style={[styles.factCard, { width: CARD_WIDTH }]}>
                    <ThemedText style={styles.factText}>
                      {item.content}
                    </ThemedText>
                  </ThemedView>
                )}
                keyExtractor={(item: ArtFact) => item.id}
              />
              <View style={styles.paginationContainer}>
                {artFacts.map((_: ArtFact, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === activeFactIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </ThemedView>
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
    backgroundColor: "#f5f5f5",
  },
  mainImageContainer: {
    position: "relative",
  },
  artworkImage: {
    width: "100%",
    height: 300,
  },
  infoContainer: {
    padding: 24,
    paddingBottom: 80,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingRight: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    flex: 1,
  },
  artist: {
    fontSize: 16,
    color: "#666",
    marginBottom: 2,
    flex: 1,
  },
  period: {
    fontSize: 14,
    color: "#999",
    flex: 1,
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
    position: "absolute",
    right: 8,
    top: 0,
  },
  arButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
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
    backgroundColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
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
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
    flex: 2,
    textAlign: "right",
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
    color: "#000",
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
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailContainer: {
    padding: THUMBNAIL_SPACING,
    backgroundColor: "#fff",
  },
  thumbnailContainerCentered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    marginHorizontal: THUMBNAIL_SPACING / 2,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailSelected: {
    borderColor: "#000",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  didYouKnowContainer: {
    marginTop: 24,
    position: "relative",
    padding: 12,
  },
  didYouKnowBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 12,
  },
  didYouKnowTitleContainer: {
    position: "absolute",
    top: -12,
    left: 24,
    zIndex: 1,
  },
  didYouKnowTitleBackground: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  didYouKnowTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  factsContainer: {
    gap: 8,
    paddingTop: 8,
  },
  factCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: "center",
    minHeight: 120,
  },
  factText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#000",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#999",
  },
  paginationDotActive: {
    backgroundColor: "#000",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
