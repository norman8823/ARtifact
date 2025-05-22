import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

const QUESTS_COMPLETED = [
  {
    id: 1,
    title: "Face to Face",
    description: "Discover the evolution of portraiture across 3 styles",
    xp: 300,
    completedDate: "April 12, 2023",
  },
  {
    id: 2,
    title: "Global Perspectives",
    description: "Explore art from 4 different world regions",
    xp: 400,
    completedDate: "March 28, 2023",
  },
  {
    id: 3,
    title: "Color Theory",
    description: "Study the use of color in 5 masterpieces",
    xp: 350,
    completedDate: "March 15, 2023",
  },
  {
    id: 4,
    title: "Renaissance Journey",
    description: "Visit 4 Renaissance artworks",
    xp: 250,
    completedDate: "March 1, 2023",
  },
  {
    id: 5,
    title: "Modern Art Explorer",
    description: "Discover 3 modern art movements",
    xp: 300,
    completedDate: "February 15, 2023",
  },
];

export default function QuestsCompletedScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Quests Completed",
          headerShadowVisible: false,
          headerBackTitle: "Profile",
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.questList}>
          {QUESTS_COMPLETED.map((quest) => (
            <ThemedView key={quest.id} style={styles.questCard}>
              <ThemedView style={styles.questHeader}>
                <ThemedView style={styles.questInfo}>
                  <ThemedText style={styles.questTitle}>
                    {quest.title}
                  </ThemedText>
                  <ThemedText style={styles.questDescription}>
                    {quest.description}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.xpBadge}>
                  <ThemedText style={styles.xpText}>+{quest.xp} XP</ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.questFooter}>
                <ThemedView style={styles.completedStatus}>
                  <FontAwesome name="check-circle" size={14} color="#16a34a" />
                  <ThemedText style={styles.completedText}>
                    Completed
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.dateText}>
                  {quest.completedDate}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 80,
  },
  questList: {
    gap: 16,
  },
  questCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  questHeader: {
    backgroundColor: "#f0fdf4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  questInfo: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  questTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#166534",
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 14,
    color: "#15803d",
    flexShrink: 1,
  },
  xpBadge: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  xpText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  questFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
  },
  completedStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
  },
  completedText: {
    fontSize: 12,
    color: "#15803d",
  },
  dateText: {
    fontSize: 12,
    color: "#15803d",
  },
});
