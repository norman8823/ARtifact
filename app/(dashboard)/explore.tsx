import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
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

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - 28) / NUM_COLUMNS;

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [showIsScannableOnly, setShowIsScannableOnly] = useState(false);
  const [showAROnly, setShowAROnly] = useState(false);
  const router = useRouter();
  const { getAllArtworks, isLoading, error } = useArtworks();

  useEffect(() => {
    const loadArtworks = async () => {
      const fetchedArtworks = await getAllArtworks();
      setArtworks(fetchedArtworks);
    };
    loadArtworks();
  }, [getAllArtworks]);

  // Filter artworks based on search query and AR availability
  const filteredArtworks = useMemo(() => {
    let filtered = artworks;

    // Apply isScannable filter
    if (showIsScannableOnly) {
      filtered = filtered.filter((artwork) => artwork.isScannable === true);
    }

    // Apply AR filter
    if (showAROnly) {
      filtered = filtered.filter((artwork) => artwork.hasAR === true);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((artwork) => {
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
          contains(artwork.description) ||
          contains(artwork.id) ||
          // Check if any tags contain the query
          artwork.tags?.some((tag) => tag?.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [artworks, searchQuery, showIsScannableOnly, showAROnly]);

  // Count AR-enabled artworks for display
  const arEnabledCount = useMemo(() => {
    return artworks.filter((artwork) => artwork.hasAR === true).length;
  }, [artworks]);

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
        {/* Scan Badge */}
        {item.isScannable && (
          <ThemedView style={styles.scanBadge}>
            <FontAwesome name="camera" size={12} color={Colors.darkMedGray} />
          </ThemedView>
        )}
        {/* AR Badge */}
        {item.hasAR && (
          <ThemedView style={styles.arBadge}>
            <FontAwesome name="cube" size={12} color={Colors.darkMedGray} />
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
                placeholderTextColor={Colors.medGray}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={Keyboard.dismiss}
                returnKeyType="done"
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  style={styles.clearButton}
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                >
                  <FontAwesome
                    name="times"
                    size={16}
                    color={Colors.darkMedGray}
                  />
                </Pressable>
              )}
            </ThemedView>

            {/* Filter Row */}
            <ThemedView style={styles.filterRow}>
              {/* Scannable Filter Checkbox */}
              <Pressable
                style={styles.filterContainer}
                onPress={() => setShowIsScannableOnly(!showIsScannableOnly)}
                accessibilityLabel={`$${
                  showIsScannableOnly ? "Disable" : "Enable"
                } Scannable only filter`}
              >
                <ThemedView style={styles.filterCheckbox}>
                  <ThemedView
                    style={[
                      styles.checkbox,
                      showIsScannableOnly && styles.checkboxChecked,
                    ]}
                  >
                    {showIsScannableOnly && (
                      <FontAwesome
                        name="check"
                        size={12}
                        color={Colors.lightGray}
                      />
                    )}
                  </ThemedView>
                  <ThemedView style={styles.filterTextContainer}>
                    <ThemedView style={styles.filterLabelRow}>
                      <FontAwesome
                        name="camera"
                        size={14}
                        color={Colors.darkMedGray}
                        style={styles.filterIcon}
                      />
                      <ThemedText style={styles.filterLabel}>Scan</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Pressable>

              {/* AR Filter Checkbox */}
              <Pressable
                style={styles.filterContainer}
                onPress={() => setShowAROnly(!showAROnly)}
                accessibilityLabel={`$${
                  showAROnly ? "Disable" : "Enable"
                } AR only filter`}
              >
                <ThemedView style={styles.filterCheckbox}>
                  <ThemedView
                    style={[
                      styles.checkbox,
                      showAROnly && styles.checkboxChecked,
                    ]}
                  >
                    {showAROnly && (
                      <FontAwesome
                        name="check"
                        size={12}
                        color={Colors.lightGray}
                      />
                    )}
                  </ThemedView>
                  <ThemedView style={styles.filterTextContainer}>
                    <ThemedView style={styles.filterLabelRow}>
                      <FontAwesome
                        name="cube"
                        size={14}
                        color={Colors.darkMedGray}
                        style={styles.filterIcon}
                      />
                      <ThemedText style={styles.filterLabel}>AR</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Pressable>
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
                <FontAwesome
                  name="search"
                  size={48}
                  color={Colors.darkMedGray}
                  style={styles.emptyIcon}
                />
                <ThemedText style={styles.emptyTitle}>
                  No artworks found
                </ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  {showIsScannableOnly && showAROnly && searchQuery.trim()
                    ? "Try adjusting your search or disabling active filters"
                    : showIsScannableOnly
                    ? "No scan-enabled artworks match your criteria"
                    : showAROnly
                    ? "No AR-enabled artworks match your criteria"
                    : "Try adjusting your search terms"}
                </ThemedText>
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
  clearButton: {
    marginLeft: 8,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
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
  scanBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  arBadge: {
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
  filterContainer: {
    paddingTop: 8,
  },
  filterCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.darkMedGray,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.darkMedGray,
  },
  filterTextContainer: {
    marginLeft: 8,
  },
  filterLabelRow: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    alignItems: "center",
  },
  filterIcon: {
    marginRight: 4,
  },
  filterLabel: {
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    color: Colors.darkMedGray,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    gap: 8,
  },
});
