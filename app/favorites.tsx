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
                  <FontAwesome
                    name="heart"
                    size={12}
                    color={Colors.favoriteRed}
                  />
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
    backgroundColor: Colors.white,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.medLightGray,
    backgroundColor: Colors.white,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: Colors.darkGray,
  },
  artist: {
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  heartContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.darkMedGray,
    textAlign: "center",
    marginTop: 20,
  },
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
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
    overflow: "hidden",
  },
});
