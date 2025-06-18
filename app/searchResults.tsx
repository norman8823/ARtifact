import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useArtworks } from "@/src/hooks/useArtworks";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
} from "react-native";
import { Colors } from "@/constants/Colors";

// Sample search results data
const SAMPLE_RESULTS = [
  {
    id: "1",
    title: "Starry Night",
    artist: "Vincent van Gogh",
    year: "1889",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/500px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
  },
  {
    id: "2",
    title: "Starry Night Over the Rhône",
    artist: "Vincent van Gogh",
    year: "1888",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Starry_Night_Over_the_Rhone.jpg/500px-Starry_Night_Over_the_Rhone.jpg",
  },
  {
    id: "3",
    title: "The Starry Night",
    artist: "Inspired Collection",
    year: "2025",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg/500px-Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg",
  },
  {
    id: "4",
    title: "Starry Night Interpretation",
    artist: "Modern Artist",
    year: "2025",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg/500px-Vincent_van_Gogh_-_De_slaapkamer_-_Google_Art_Project.jpg",
  },
];

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const query = params.query as string;
  const [searchQuery, setSearchQuery] = useState(query || "");
  const hasResults = SAMPLE_RESULTS.length > 0;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Search Results",
          headerBackTitle: "Explore",
        }}
      />

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
            placeholder="Search artworks, artists, or periods..."
            placeholderTextColor={Colors.medGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </ThemedView>
      </ThemedView>

      {/* Results */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {hasResults ? (
          SAMPLE_RESULTS.map((result) => (
            <Pressable
              key={result.id}
              style={styles.resultCard}
              onPress={() => {
                router.push({
                  pathname: "/artDetail",
                  params: {
                    id: result.id,
                    source: "Search Results",
                  },
                });
              }}
            >
              <ThemedView style={styles.artworkImageContainer}>
                <Image
                  source={{ uri: result.image }}
                  style={styles.artworkImage}
                  contentFit="cover"
                />
              </ThemedView>
              <ThemedView style={styles.artworkInfo}>
                <Text
                  style={styles.artworkTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {result.title}
                </Text>
                <ThemedText style={styles.artistName}>
                  {result.artist}
                </ThemedText>
                <ThemedText style={styles.year}>{result.year}</ThemedText>
              </ThemedView>
            </Pressable>
          ))
        ) : (
          <ThemedView style={styles.noResults}>
            <ThemedText style={styles.noResultsText}>
              No results found for your search.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  searchContainer: {
    padding: 20,
    backgroundColor: "white",
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
    height: 50,
    backgroundColor: Colors.lightGray,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    color: Colors.darkGray,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: "center",
  },
  artworkImageContainer: {
    backgroundColor: "#fff",
  },
  artworkImage: {
    width: 90,
    height: 90,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  artworkInfo: {
    flex: 1,
    paddingHorizontal: 16,
  },
  artworkTitle: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: 500,
  },
  artistName: {
    fontSize: 14,
    color: "#666",
  },
  year: {
    fontSize: 12,
    marginTop: 4,
    color: "#999",
  },
  noResults: {
    paddingTop: 48,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 14,
    color: "#6b7280",
  },
});
