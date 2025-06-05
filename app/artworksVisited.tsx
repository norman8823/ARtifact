import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import { Dimensions, Pressable, ScrollView, StyleSheet } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ARTWORK_WIDTH = (SCREEN_WIDTH - 64) / 2;

const VISITED_ARTWORKS = [
  {
    id: 1,
    title: "Starry Night",
    artist: "Vincent van Gogh",
    image: "https://images.metmuseum.org/CRDImages/ep/original/DT1567.jpg",
  },
  {
    id: 2,
    title: "The Dance",
    artist: "Henri Matisse",
    image:
      "https://images.metmuseum.org/CRDImages/ep/original/DP-20339-001.jpg",
  },
  {
    id: 3,
    title: "The Persistence of Memory",
    artist: "Salvador Dalí",
    image: "https://images.metmuseum.org/CRDImages/ep/original/DT1927.jpg",
  },
  {
    id: 4,
    title: "The Card Players",
    artist: "Paul Cézanne",
    image:
      "https://images.metmuseum.org/CRDImages/ep/original/DP-19279-001.jpg",
  },
  {
    id: 5,
    title: "The Birth of Venus",
    artist: "Sandro Botticelli",
    image: "https://images.metmuseum.org/CRDImages/ep/original/DP231395.jpg",
  },
  {
    id: 6,
    title: "The Bedroom",
    artist: "Vincent van Gogh",
    image:
      "https://images.metmuseum.org/CRDImages/ep/original/DP-20337-001.jpg",
  },
  {
    id: 7,
    title: "Water Lilies",
    artist: "UX Pilot Monet",
    image:
      "https://images.metmuseum.org/CRDImages/ep/original/DP-14286-001.jpg",
  },
  {
    id: 8,
    title: "The Night Watch",
    artist: "Rembrandt",
    image: "https://images.metmuseum.org/CRDImages/ep/original/DP159486.jpg",
  },
  {
    id: 9,
    title: "The Kiss",
    artist: "Gustav Klimt",
    image:
      "https://images.metmuseum.org/CRDImages/ep/original/DP-14186-001.jpg",
  },
  {
    id: 10,
    title: "Self-Portrait",
    artist: "Frida Kahlo",
    image: "https://images.metmuseum.org/CRDImages/ep/original/DP152027.jpg",
  },
  {
    id: 11,
    title: "American Gothic",
    artist: "Grant Wood",
    image:
      "https://images.metmuseum.org/CRDImages/ep/original/DP-20339-001.jpg",
  },
  {
    id: 12,
    title: "The Great Wave off Kanagawa",
    artist: "Katsushika Hokusai",
    image:
      "https://images.metmuseum.org/CRDImages/ep/original/DP-14253-015.jpg",
  },
];

export default function ArtworksVisitedScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Artworks Visited",
          headerShadowVisible: false,
          headerBackTitle: "Profile",
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.grid}>
          {VISITED_ARTWORKS.map((artwork) => (
            <Pressable
              key={artwork.id}
              style={styles.artworkContainer}
              onPress={() => {
                router.push({
                  pathname: "/artDetail",
                  params: {
                    id: artwork.id,
                    source: "Artworks Visited",
                  },
                });
              }}
            >
              <ThemedView style={styles.imageContainer}>
                <Image
                  source={{ uri: artwork.image }}
                  style={styles.image}
                  contentFit="cover"
                />
                <ThemedView style={styles.checkmarkContainer}>
                  <FontAwesome name="eye" size={12} color="#fff" />
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.title} numberOfLines={1}>
                {artwork.title}
              </ThemedText>
              <ThemedText style={styles.artist} numberOfLines={1}>
                {artwork.artist}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 80,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  artworkContainer: {
    width: ARTWORK_WIDTH,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  checkmarkContainer: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
  },
  artist: {
    fontSize: 12,
    color: "#666",
  },
});
