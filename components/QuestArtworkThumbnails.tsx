import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { type QuestArtworkThumbnail } from "@/src/hooks/useQuests";
import { Image as ExpoImage } from "expo-image";
import { Image as RNImage } from "react-native";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

interface QuestArtworkThumbnailsProps {
  artworks: QuestArtworkThumbnail[];
  visitedArtworkIds?: string[]; // For progress indication
  isCompleted?: boolean; // For completed quests - all should have green border
}

export const QuestArtworkThumbnails = memo(function QuestArtworkThumbnails({
  artworks,
  visitedArtworkIds = [],
  isCompleted = false
}: QuestArtworkThumbnailsProps) {
  if (!artworks || artworks.length === 0) {
    return null;
  }


  // Limit to 5 artworks maximum for clean layout
  const displayArtworks = artworks.slice(0, 5);

  // Ultra-aggressive cache-busting to prevent persistent cache issues
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const componentId = React.useId ? React.useId() : 'default';

  const getCacheBustedUrl = (artwork: any) => {
    if (!artwork.primaryImageSmall) return null;

    // Multi-layer cache-busting with timestamp, random, and component hash
    const separator = artwork.primaryImageSmall.includes('?') ? '&' : '?';
    const cacheBuster = `${separator}v=${timestamp}&r=${random}&c=${componentId}&force=true`;
    const finalUrl = `${artwork.primaryImageSmall}${cacheBuster}`;
    console.log(`🔧 Ultra cache-busting URL for ${artwork.id} (${artwork.title}):`);
    console.log(`   Original: ${artwork.primaryImageSmall}`);
    console.log(`   Final: ${finalUrl}`);
    return finalUrl;
  };

  // Calculate dynamic thumbnail size and gap based on number of artworks (square)
  const artworkCount = displayArtworks.length;
  const getThumbnailSize = () => {
    switch (artworkCount) {
      case 1: return 120;  // Very large for single artwork
      case 2: return 100;  // Large for two artworks
      case 3: return 95;   // Larger for three artworks - more room to grow
      case 4: return 75;   // Medium for four artworks - just right
      case 5: return 58;   // Smaller for five artworks - prevent spillover
      default: return 58;
    }
  };

  const getGapSize = () => {
    switch (artworkCount) {
      case 1: return 12;
      case 2: return 12;
      case 3: return 12;   // Good spacing for 3 larger thumbnails
      case 4: return 10;   // Current spacing works well
      case 5: return 8;    // Tighter spacing for 5 thumbnails
      default: return 8;
    }
  };

  const thumbnailSize = getThumbnailSize();
  const gapSize = getGapSize();

  return (
    <ThemedView
      key={`thumbnails-${timestamp}-${random}`}
      style={[styles.container, { gap: gapSize }]}
    >
      {displayArtworks.map((artwork, index) => {
        const isVisited = visitedArtworkIds.includes(artwork.id);
        const shouldShowVisited = isCompleted || isVisited;

        return (
          <ThemedView
            key={`${artwork.id}-${index}`}
            style={[
              styles.thumbnailContainer,
              {
                width: thumbnailSize,
                height: thumbnailSize, // Make perfect squares
                backgroundColor: 'transparent', // Remove any background
              }
            ]}
          >
            {artwork.primaryImageSmall ? (
              <RNImage
                source={{ uri: getCacheBustedUrl(artwork) }}
                style={[
                  {
                    width: '100%',
                    height: '100%',
                    borderRadius: 6, // Smaller to show the bevel border effect
                  },
                  !shouldShowVisited && styles.unvisitedOverlay
                ]}
                resizeMode="cover"
                defaultSource={require("@/assets/images/Color logo - no background.png")}
              />
            ) : (
              <RNImage
                source={require("@/assets/images/Color logo - no background.png")}
                style={[
                  {
                    width: '100%',
                    height: '100%',
                    borderRadius: 6, // Match the main image border radius
                  },
                  !shouldShowVisited && styles.unvisitedOverlay
                ]}
                resizeMode="cover"
              />
            )}
          </ThemedView>
        );
      })}
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
    backgroundColor: 'transparent',
    // No horizontal margins - align with other card elements (respects card's 16px padding)
    // Gap is now dynamic based on artwork count
  },
  thumbnailContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderRightColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomColor: 'rgba(0, 0, 0, 0.25)',
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  unvisitedOverlay: {
    opacity: 0.7,
  },
});