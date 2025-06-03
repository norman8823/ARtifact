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
const ITEM_WIDTH = (SCREEN_WIDTH - 20) / NUM_COLUMNS;

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
        columnWrapperStyle={styles.columnWrapper}
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
    padding: 14,
    paddingBottom: ITEM_WIDTH, // Extra padding for tab bar
  },
  columnWrapper: {
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
});
