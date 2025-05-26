import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - 16) / NUM_COLUMNS; // 16 is total gap (4 * 4)

interface ArtworkItem {
  id: number;
  image: string;
  hasMultipleImages: boolean;
}

// Sample data - in a real app this would come from an API
const ARTWORKS: ArtworkItem[] = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  image:
    "https://upload.wikimedia.org/wikipedia/commons/9/95/Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg",
  hasMultipleImages: index % 3 === 0,
}));

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const renderItem = ({ item }: { item: ArtworkItem }) => (
    <Link
      href={{ pathname: "/artDetail", params: { source: "Explore" } }}
      asChild
    >
      <Pressable style={styles.gridItem}>
        <Image source={{ uri: item.image }} style={styles.artworkImage} />
        <ThemedView style={styles.iconContainer}>
          <FontAwesome
            name={item.hasMultipleImages ? "clone" : "image"}
            size={16}
            color="#fff"
          />
        </ThemedView>
      </Pressable>
    </Link>
  );

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
        data={ARTWORKS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={NUM_COLUMNS}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
