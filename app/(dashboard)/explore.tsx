import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useInfiniteArtworks, type Artwork } from "@/src/hooks/useInfiniteArtworks";
import { ArtworkSkeletonGrid } from "@/components/ArtworkSkeleton";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TextInput,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - 28) / NUM_COLUMNS;

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState(""); // For immediate UI update
  const [showIsScannableOnly, setShowIsScannableOnly] = useState(false);
  const [showAROnly, setShowAROnly] = useState(false);
  const router = useRouter();

  const {
    artworks,
    pagination,
    fetchNextPage,
    refresh,
    shouldPrefetch
  } = useInfiniteArtworks({
    limit: 60,
    prefetchThreshold: 3,
    searchQuery,
    showIsScannableOnly,
    showAROnly
  });

  // Debounced search function
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(query);
    }, 300);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Initial load and filter changes
  useEffect(() => {
    refresh();
  }, [searchQuery, showIsScannableOnly, showAROnly]);

  // Auto-fetch more data when filters result in too few items
  useEffect(() => {
    const hasActiveFilters = showIsScannableOnly || showAROnly;
    const needsMoreData = hasActiveFilters &&
                          artworks.length < 15 &&
                          pagination.hasNextPage &&
                          !pagination.isFetchingMore &&
                          !pagination.isLoading;

    if (needsMoreData) {
      console.log(`Auto-fetching more data. Current filtered results: ${artworks.length}`);
      fetchNextPage();
    }
  }, [artworks.length, showIsScannableOnly, showAROnly, pagination.hasNextPage, pagination.isFetchingMore, pagination.isLoading, fetchNextPage]);

  // Handle infinite scroll - need to check if we need more results for filtering
  const handleEndReached = () => {
    // If we have filters active and few results, keep fetching until we have enough
    const hasActiveFilters = showIsScannableOnly || showAROnly;
    const shouldContinueFetching = hasActiveFilters && artworks.length < 20 && pagination.hasNextPage;

    if ((pagination.hasNextPage && !pagination.isFetchingMore) || shouldContinueFetching) {
      fetchNextPage();
    }
  };


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

  if (pagination.isLoading && artworks.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <ThemedView style={styles.headerContainer}>
            <ThemedText type="title" style={styles.pageTitle}>
              Explore
            </ThemedText>
          </ThemedView>

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
                value={inputValue}
                onChangeText={(text) => {
                  setInputValue(text);
                  debouncedSearch(text);
                }}
                onSubmitEditing={Keyboard.dismiss}
                returnKeyType="done"
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
              />
            </ThemedView>
          </ThemedView>
          <ThemedView style={styles.gridContainer}>
            <ArtworkSkeletonGrid count={12} />
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (pagination.error && artworks.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Error loading artworks: {pagination.error.message}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <ThemedView style={styles.headerContainer}>
            <ThemedText type="title" style={styles.pageTitle}>
              Explore
            </ThemedText>
          </ThemedView>

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
                value={inputValue}
                onChangeText={(text) => {
                  setInputValue(text); // Update UI immediately
                  debouncedSearch(text); // Trigger search after 300ms delay
                }}
                onSubmitEditing={Keyboard.dismiss}
                returnKeyType="done"
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                keyboardType="default"
                textContentType="none"
                clearButtonMode="never"
              />
              {inputValue.length > 0 && (
                <Pressable
                  onPress={() => {
                    setInputValue("");
                    setSearchQuery("");
                  }}
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
                onPress={() => {
                  setShowIsScannableOnly(!showIsScannableOnly);
                }}
                accessibilityLabel={`${
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
                onPress={() => {
                  setShowAROnly(!showAROnly);
                }}
                accessibilityLabel={`${
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
                      <ThemedText style={[styles.filterLabel, { color: Colors.metRed }]}>AR</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Pressable>
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
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={pagination.isLoading && artworks.length > 0}
                onRefresh={refresh}
                tintColor={Colors.darkMedGray}
              />
            }
            ListFooterComponent={
              pagination.isFetchingMore ? (
                <ThemedView style={styles.loadingFooter}>
                  <ArtworkSkeletonGrid count={6} />
                </ThemedView>
              ) : null
            }
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
  headerContainer: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 0,
  },
  pageTitle: {
    fontSize: 30,
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
  loadingFooter: {
    paddingVertical: 20,
  },
});
