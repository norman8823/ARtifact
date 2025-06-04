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

const SCREEN_WIDTH = Dimensions.get("window").width;
const ARTWORK_WIDTH = (SCREEN_WIDTH - 48) / 2; // 48 = padding (16 * 2) + gap (16)

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
        <ActivityIndicator size="large" color="#333" />
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
            headerBackTitle: "Profile",
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
          headerBackTitle: "Profile",
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
                  <FontAwesome name="heart" size={12} color="#ff4d4d" />
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
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
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
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  heartContainer: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    color: "#666",
  },
});
