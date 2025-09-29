import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - 28) / NUM_COLUMNS;

interface ArtworkSkeletonProps {
  style?: any;
}

export function ArtworkSkeleton({ style }: ArtworkSkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <ThemedView style={[styles.container, style]}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <ThemedView style={styles.imageSkeleton} />
      </Animated.View>
    </ThemedView>
  );
}

interface ArtworkSkeletonGridProps {
  count?: number;
}

export function ArtworkSkeletonGrid({ count = 6 }: ArtworkSkeletonGridProps) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <ArtworkSkeleton key={`skeleton-${index}`} style={styles.gridItem} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    padding: 2,
  },
  gridItem: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    padding: 2,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  imageSkeleton: {
    flex: 1,
    backgroundColor: Colors.medGray,
    borderRadius: 4,
  },
});