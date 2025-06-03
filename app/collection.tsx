import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Dimensions, Pressable, ScrollView, StyleSheet } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface FeaturedWork {
  id: number;
  title: string;
  artist: string;
  period: string;
  image: string;
}

const FEATURED_WORKS: FeaturedWork[] = [
  // TODO: Replace with real artwork data from the database
  // Current IDs are just for demonstration and won't match real artwork IDs
  {
    id: 1,
    title: "Venus de Milo",
    artist: "Alexandros of Antioch",
    period: "c. 130-100 BCE",
    image:
      "https://collectionapi.metmuseum.org/api/collection/v1/iiif/247000/preview",
  },
  {
    id: 2,
    title: "The Thinker",
    artist: "Auguste Rodin",
    period: "1902",
    image:
      "https://collectionapi.metmuseum.org/api/collection/v1/iiif/207825/preview",
  },
  {
    id: 3,
    title: "David",
    artist: "Michelangelo",
    period: "1501-1504",
    image:
      "https://collectionapi.metmuseum.org/api/collection/v1/iiif/204778/preview",
  },
  {
    id: 4,
    title: "Winged Victory",
    artist: "Unknown Artist",
    period: "c. 200-190 BCE",
    image:
      "https://collectionapi.metmuseum.org/api/collection/v1/iiif/130/preview",
  },
  {
    id: 5,
    title: "Perseus with Head of Medusa",
    artist: "Benvenuto Cellini",
    period: "1545",
    image:
      "https://collectionapi.metmuseum.org/api/collection/v1/iiif/204807/preview",
  },
];

export default function CollectionScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Image */}
      <ThemedView style={styles.headerContainer}>
        <Image
          source={{
            uri: "https://www.famsf.org/storage/images/6df0106c-a149-42c6-a21d-b69611a269b4/pietre-dure-panel.jpg?crop=2000,1330,x0,y1508&format=jpg&quality=80&width=1000",
          }}
          style={styles.headerImage}
          contentFit="cover"
        />
      </ThemedView>

      {/* Collection Content */}
      <ThemedView style={styles.content}>
        {/* Title and Stats */}
        <ThemedView style={styles.titleSection}>
          <ThemedText style={styles.title}>
            European Sculpture and Decorative Arts
          </ThemedText>
          <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statItem}>
              <FontAwesome name="image" size={14} color="#666" />
              <ThemedText style={styles.statText}>2,346 works</ThemedText>
            </ThemedView>
            <ThemedText style={styles.statDivider}>•</ThemedText>
            <ThemedText style={styles.statText}>5 Galleries</ThemedText>
          </ThemedView>
          <ThemedText style={styles.description}>
            Discover masterpieces of European sculpture, metalwork, ceramics,
            glass, jewelry, furniture, textiles, and other decorative arts from
            the medieval period to the early twentieth century.
          </ThemedText>
        </ThemedView>

        {/* Featured Works */}
        <ThemedView style={styles.featuredSection}>
          <ThemedView style={styles.featuredHeader}>
            <ThemedText style={styles.featuredTitle}>Featured Works</ThemedText>
            <ThemedText style={styles.seeAllButton}>See all</ThemedText>
          </ThemedView>

          <ThemedView style={styles.featuredList}>
            {FEATURED_WORKS.map((work) => (
              <Link
                key={work.id}
                href={{
                  pathname: "/artDetail",
                  params: {
                    id: work.id.toString(),
                    source: "Collection",
                  },
                }}
                asChild
              >
                <Pressable>
                  <ThemedView style={styles.workCard}>
                    <Image
                      source={{ uri: work.image }}
                      style={styles.workImage}
                      contentFit="cover"
                    />
                    <ThemedView style={styles.workInfo}>
                      <ThemedText style={styles.workTitle}>
                        {work.title}
                      </ThemedText>
                      <ThemedText style={styles.workArtist}>
                        {work.artist}
                      </ThemedText>
                      <ThemedText style={styles.workPeriod}>
                        {work.period}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#666",
  },
  statDivider: {
    marginHorizontal: 8,
    color: "#666",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  featuredSection: {
    marginBottom: 96,
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAllButton: {
    fontSize: 14,
    color: "#666",
  },
  featuredList: {
    gap: 12,
  },
  workCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
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
    padding: 12,
    alignItems: "center",
  },
  workImage: {
    width: 90,
    height: 90,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  workInfo: {
    flex: 1,
    paddingHorizontal: 16,
  },
  workTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  workArtist: {
    fontSize: 14,
    color: "#666",
  },
  workPeriod: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});
