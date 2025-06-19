import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useFavoritesContext } from "@/src/contexts/FavoritesContext";
import {
  type FavoriteArtwork,
  useFavoriteArtworks,
} from "@/src/hooks/useFavoriteArtworks";
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
import { Colors } from "@/constants/Colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ARTWORK_WIDTH = (SCREEN_WIDTH - 64) / 2;

export default function FavoritesScreen() {
  const { getFavoriteArtworks, isLoading, error } = useFavoriteArtworks();
  const [favoriteArtworks, setFavoriteArtworks] = useState<FavoriteArtwork[]>(
    []
  );
  const { lastRefreshTime } = useFavoritesContext();

  useEffect(() => {
    const loadFavorites = async () => {
      const artworks = await getFavoriteArtworks();
      setFavoriteArtworks(artworks);
    };

    loadFavorites();
  }, [getFavoriteArtworks, lastRefreshTime]);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.darkGray} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Error loading favorites: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  if (favoriteArtworks.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            title: "Favorites",
            headerShadowVisible: false,
          }}
        />
        <ThemedText style={styles.emptyText}>
          No favorite artworks yet
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Favorites",
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.grid}>
          {favoriteArtworks.map((artwork) => (
            <Pressable
              key={artwork.id}
              style={styles.artworkContainer}
              onPress={() => {
                router.push({
                  pathname: "/artDetail",
                  params: {
                    id: artwork.id,
                    source: "Favorites",
                  },
                });
              }}
            >
              <ThemedView style={styles.imageContainer}>
                <Image
                  source={{ uri: artwork.primaryImage || undefined }}
                  style={styles.image}
                  contentFit="cover"
                />
                <ThemedView style={styles.heartContainer}>
                  <FontAwesome
                    name="heart"
                    size={12}
                    color={Colors.favoriteRed}
                  />
                </ThemedView>
              </ThemedView>
              <ThemedText type="title" style={styles.title} numberOfLines={1}>
                {artwork.title}
              </ThemedText>
              <ThemedText
                type="subtitle"
                style={styles.artist}
                numberOfLines={1}
              >
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
    backgroundColor: Colors.lightGray,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 14,
    lineHeight: 24,
  },
  artist: {
    fontSize: 12,
    color: Colors.darkMedGray,
  },
  heartContainer: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {},
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
    backgroundColor: Colors.medLightGray,
    marginBottom: 8,
    overflow: "hidden",
  },
});
