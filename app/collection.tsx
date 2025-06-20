import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useDepartmentDetail } from "@/src/hooks/useDepartmentDetail";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function CollectionScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const {
    getDepartmentById,
    department,
    departmentArtworks,
    isLoading,
    error,
  } = useDepartmentDetail();

  useEffect(() => {
    if (id) {
      getDepartmentById(id);
    }
  }, [id, getDepartmentById]);

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Error loading collection: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  // Show not found state
  if (!department) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Collection not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Image */}
      <ThemedView style={styles.headerContainer}>
        <Image
          source={{
            uri: department.coverImage || undefined,
          }}
          style={styles.headerImage}
          contentFit="cover"
        />
      </ThemedView>

      {/* Collection Content */}
      <ThemedView style={styles.content}>
        {/* Title and Stats */}
        <ThemedView style={styles.titleSection}>
          <ThemedText type="title" style={styles.title}>
            {department.displayName}
          </ThemedText>
          {/* <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statItem}>
              <FontAwesome name="image" size={14} color={Colors.darkMedGray} />
              <ThemedText style={styles.statText}>
                {departmentArtworks.length} works
              </ThemedText>
            </ThemedView>
            <ThemedText style={styles.statDivider}>•</ThemedText>
            <ThemedText style={styles.statText}>
              {Math.ceil(departmentArtworks.length / 50)} Galleries
            </ThemedText>
          </ThemedView> */}
          <ThemedText style={styles.description}>
            {department.description ||
              "Discover masterpieces from this amazing collection."}
          </ThemedText>
        </ThemedView>

        {/* Featured Works */}
        <ThemedView style={styles.featuredSection}>
          <ThemedView style={styles.featuredHeader}>
            <ThemedText type="title" style={styles.featuredTitle}>
              Featured Works
            </ThemedText>
            {/* <ThemedText style={styles.seeAllButton}>See all</ThemedText> */}
          </ThemedView>

          <ThemedView style={styles.featuredList}>
            {departmentArtworks.map((artwork) => (
              <Link
                key={artwork.id}
                href={{
                  pathname: "/artDetail",
                  params: {
                    id: artwork.id,
                    source: "Collection",
                  },
                }}
                asChild
              >
                <Pressable>
                  <ThemedView style={styles.workCard}>
                    <Image
                      source={{ uri: artwork.primaryImage || undefined }}
                      style={styles.workImage}
                      contentFit="cover"
                    />
                    <ThemedView style={styles.workInfo}>
                      <ThemedText
                        style={styles.workTitle}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        type="title"
                      >
                        {artwork.title}
                      </ThemedText>
                      <ThemedText type="subtitle" style={styles.workArtist}>
                        {artwork.artistDisplayName || "Unknown Artist"}
                      </ThemedText>
                      <ThemedText type="subtitle" style={styles.workPeriod}>
                        {artwork.period || "Date unknown"}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </Pressable>
              </Link>
            ))}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  headerContainer: {
    height: 250,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 36,
  },
  title: {
    marginBottom: 16,
  },
  // statsContainer: {
  //   flexDirection: "row",
  //   marginBottom: 20,
  // },
  // statItem: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginRight: 20,
  // },
  // statText: {
  //   fontSize: 14,
  //   color: Colors.darkMedGray,
  //   marginLeft: 6,
  // },
  // statDivider: {
  //   marginHorizontal: 8,
  //   color: Colors.darkMedGray,
  // },
  description: {
    color: Colors.darkMedGray,
  },
  featuredSection: {
    marginBottom: 80,
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  featuredTitle: {
    fontSize: 20,
  },
  // seeAllButton: {
  //   fontSize: 14,
  //   color: Colors.darkMedGray,
  // },
  featuredList: {
    gap: 12,
  },
  workCard: {
    flexDirection: "row",
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    ...shadowStyle,
  },
  workImage: {
    width: 90,
    height: 90,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  workInfo: {
    backgroundColor: Colors.medLightGray,
    flex: 1,
    paddingHorizontal: 16,
  },
  workTitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  workArtist: {
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  workPeriod: {
    fontSize: 12,
    color: Colors.darkMedGray,
    marginTop: 4,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});
