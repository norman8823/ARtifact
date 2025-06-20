import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { useFavoritesContext } from "@/src/contexts/FavoritesContext";
import { type ArtFact, useArtFacts } from "@/src/hooks/useArtFacts";
import { type Artwork, useArtwork } from "@/src/hooks/useArtwork";
import { useFavorites } from "@/src/hooks/useFavorites";
import { useGalleryMaps } from "@/src/hooks/useGalleryMaps";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Linking,
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
  const { getMapURLByGalleryNumber, loadGalleryMaps } = useGalleryMaps();

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

  useEffect(() => {
    loadGalleryMaps();
  }, [loadGalleryMaps]);

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

  const handleGalleryPress = async (galleryNumber: string) => {
    const mapURL = getMapURLByGalleryNumber(galleryNumber);
    if (mapURL) {
      const canOpen = await Linking.canOpenURL(mapURL);
      if (canOpen) {
        await Linking.openURL(mapURL);
      } else {
        console.error("Cannot open URL:", mapURL);
      }
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
              <FontAwesome
                name="search-plus"
                size={24}
                color={Colors.lightGray}
              />
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
                <FontAwesome name="times" size={24} color={Colors.lightGray} />
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
              <ThemedText type="title" style={styles.title}>
                {artwork.title}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.artist}>
                {artwork.artistDisplayName || "Unknown Artist"}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.period}>
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
                color={isFavorited ? Colors.favoriteRed : Colors.darkMedGray}
              />
            </Pressable>
          </ThemedView>

          {/* Scan Button */}
          <Pressable
            style={styles.scanButton}
            onPress={() => router.push("/scan")}
          >
            <FontAwesome name="camera" size={18} color={Colors.lightGray} />
            <ThemedText style={styles.scanButtonText}>Scan Artwork</ThemedText>
          </Pressable>

          {/* AR Button - Only show if artwork has AR support */}
          {artwork.hasAR && (
            <Pressable
              style={styles.arButton}
              onPress={() => {
                router.push({
                  pathname: "/arViewer",
                  params: {
                    artworkId: artwork.id,
                    title: artwork.title,
                    arImage: artwork.arImage,
                  },
                });
              }}
            >
              <FontAwesome name="cube" size={18} color={Colors.lightGray} />
              <ThemedText style={styles.arButtonText}>View in AR</ThemedText>
            </Pressable>
          )}

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
                <Pressable
                  onPress={() => handleGalleryPress(artwork.galleryNumber!)}
                  style={({ pressed }) => [
                    styles.galleryNumberContainer,
                    pressed && styles.galleryNumberPressed,
                  ]}
                >
                  <FontAwesome
                    name="map-marker"
                    size={14}
                    color={Colors.darkMedGray}
                    style={styles.galleryIcon}
                  />
                  <ThemedText style={styles.galleryNumber}>
                    Gallery {artwork.galleryNumber}
                  </ThemedText>
                </Pressable>
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
                  <ThemedText type="subtitle" style={styles.didYouKnowTitle}>
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
                    <FontAwesome
                      name="file-text-o"
                      size={18}
                      color={Colors.darkMedGray}
                    />
                  </Pressable>
                  <Pressable style={styles.playButton}>
                    <FontAwesome
                      name="play"
                      size={14}
                      color={Colors.lightGray}
                    />
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
    backgroundColor: Colors.lightGray,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {},
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
    marginBottom: 4,
    flex: 1,
  },
  artist: {
    fontSize: 16,
    color: Colors.darkMedGray,
    marginBottom: 2,
    flex: 1,
  },
  period: {
    fontSize: 14,
    color: Colors.darkMedGray,
    flex: 1,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 0,
    top: 0,
    ...shadowStyle,
  },
  scanButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.darkGray,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...shadowStyle,
  },
  scanButtonText: {
    color: Colors.lightGray,
  },
  arButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.darkGray,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...shadowStyle,
  },
  arButtonText: {
    color: Colors.lightGray,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.medLightGray,
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
    color: Colors.darkMedGray,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    flex: 2,
    textAlign: "right",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  audioGuideCard: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 16,
    ...shadowStyle,
  },
  audioGuideContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightGray,
  },
  guideInfo: {
    flex: 1,
    marginLeft: 16,
  },
  guideTitle: {
    fontSize: 14,
  },
  guideDuration: {
    fontSize: 12,
    color: Colors.darkMedGray,
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
    backgroundColor: Colors.darkGray,
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyle,
  },
  thumbnailContainer: {
    padding: THUMBNAIL_SPACING,
    backgroundColor: Colors.lightGray,
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
    borderColor: "black",
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
    borderColor: Colors.darkMedGray,
    borderRadius: 12,
  },
  didYouKnowTitleContainer: {
    position: "absolute",
    top: -12,
    left: 24,
    zIndex: 1,
  },
  didYouKnowTitleBackground: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
  },
  didYouKnowTitle: {
    fontSize: 18,
  },
  factsContainer: {
    gap: 8,
    paddingTop: 8,
  },
  factCard: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 20,
    justifyContent: "center",
    minHeight: 120,
  },
  factText: {
    fontSize: 15,
    lineHeight: 22,
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
    backgroundColor: Colors.medGray,
  },
  paginationDotActive: {
    backgroundColor: "black",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  galleryNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: Colors.medLightGray,
  },
  galleryNumberPressed: {
    opacity: 0.7,
  },
  galleryIcon: {
    marginRight: 6,
  },
  galleryNumber: {
    fontSize: 15,
    color: Colors.darkMedGray,
  },
});
