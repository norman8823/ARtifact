import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Profile</ThemedText>
      <ThemedView style={styles.linksContainer}>
        <Link href="/profileSettings" style={styles.link}>
          <ThemedText>Settings</ThemedText>
        </Link>
        <Link href="/artworkVisited" style={styles.link}>
          <ThemedText>Artwork Visited</ThemedText>
        </Link>
        <Link href="/favorites" style={styles.link}>
          <ThemedText>Favorites</ThemedText>
        </Link>
        <Link href="/completedQuests" style={styles.link}>
          <ThemedText>Completed Quests</ThemedText>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  linksContainer: {
    width: "100%",
    gap: 15,
  },
  link: {
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    width: "100%",
  },
});
