import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useArtworks, type Artwork } from "@/src/hooks/useArtworks";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Colors } from "@/constants/Colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - 28) / NUM_COLUMNS;

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

  // Filter artworks based on search query
  const filteredArtworks = useMemo(() => {
    if (!searchQuery.trim()) return artworks;

    const query = searchQuery.toLowerCase().trim();
    return artworks.filter((artwork) => {
      // Helper function to safely check if a string contains the query
      const contains = (value: string | null | undefined) =>
        value?.toLowerCase().includes(query) || false;

      // Check if any of the artwork fields match the query
      return (
        contains(artwork.title) ||
        contains(artwork.artistDisplayName) ||
        contains(artwork.culture) ||
        contains(artwork.medium) ||
        contains(artwork.classification) ||
        contains(artwork.objectType) ||
        // Check if any tags contain the query
        artwork.tags?.some((tag) => tag?.toLowerCase().includes(query))
      );
    });
  }, [artworks, searchQuery]);

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
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ThemedView style={styles.container}>
          {/* Search Bar */}
          <ThemedView style={styles.searchContainer}>
            <ThemedView style={styles.searchBar}>
              <FontAwesome
                name="search"
                size={16}
                color={Colors.darkMedGray}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search artworks, artists, periods..."
                placeholderTextColor="Colors.medGray"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={Keyboard.dismiss}
                returnKeyType="done"
              />
            </ThemedView>
          </ThemedView>

          {/* Grid */}
          <FlatList
            data={filteredArtworks}
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
    backgroundColor: Colors.medLightGray,
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
    color: Colors.darkMedGray,
    height: "100%",
  },
  gridContainer: {
    paddingTop: 16,
    paddingBottom: ITEM_WIDTH,
    paddingHorizontal: 14,
  },
  gridItem: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    padding: 2,
  },
  artworkImage: {
    flex: 1,
    backgroundColor: Colors.medLightGray,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
