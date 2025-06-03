import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useArtworks, type Artwork } from "@/src/hooks/useArtworks";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - 16) / NUM_COLUMNS; // 16 is total gap (4 * 4)

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const router = useRouter();
  const { getAllArtworks, isLoading, error } = useArtworks();

  useEffect(() => {
    const loadArtworks = async () => {
      const fetchedArtworks = await getAllArtworks();
      setArtworks(fetchedArtworks);
    };
    loadArtworks();
  }, [getAllArtworks]);

  const renderItem = ({ item }: { item: Artwork }) => (
    <Link
      href={{
        pathname: "/artDetail",
        params: {
          id: item.id,
          source: "Explore",
        },
      }}
      asChild
    >
      <Pressable style={styles.gridItem}>
        <Image
          source={{ uri: item.primaryImage || undefined }}
          style={styles.artworkImage}
          contentFit="cover"
        />
        {item.primaryImage && item.primaryImageSmall && (
          <ThemedView style={styles.iconContainer}>
            <FontAwesome name="clone" size={16} color="#fff" />
          </ThemedView>
        )}
      </Pressable>
    </Link>
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Error loading artworks: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Search Bar */}
      <ThemedView style={styles.searchContainer}>
        <ThemedView style={styles.searchBar}>
          <FontAwesome
            name="search"
            size={16}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search artworks, artists, periods..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                router.push({
                  pathname: "/searchResults",
                  params: { query: searchQuery.trim() },
                });
              } else {
                router.push("/searchResults");
              }
            }}
            returnKeyType="search"
          />
        </ThemedView>
      </ThemedView>

      {/* Grid */}
      <FlatList
        data={artworks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <ThemedView style={styles.centerContent}>
            <ThemedText>No artworks found</ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    height: "100%",
  },
  gridContainer: {
    padding: 2,
    paddingBottom: 80, // Extra padding for tab bar
  },
  gridItem: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    padding: 2,
  },
  artworkImage: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  iconContainer: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
