import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ProfileScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push("/profileSettings")}
        >
          <FontAwesome name="gear" size={24} color="#333" />
        </Pressable>
      </ThemedView>

      {/* User Info Section */}
      <ThemedView style={styles.userInfo}>
        <Image
          source={{
            uri: "https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=789",
          }}
          style={styles.avatar}
        />
        <ThemedText style={styles.userName}>Sarah Johnson</ThemedText>
        <ThemedView style={styles.rankContainer}>
          <ThemedView style={styles.rankBadge}>
            <ThemedText style={styles.rankText}>Art Expert</ThemedText>
          </ThemedView>
          <ThemedText style={styles.xpText}>2,450 XP</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Stats Grid */}
      <ThemedView style={styles.statsGrid}>
        <Pressable style={styles.statCard}>
          <ThemedText style={styles.statNumber}>47</ThemedText>
          <ThemedText style={styles.statLabel}>Artworks Visited</ThemedText>
        </Pressable>
        <Pressable style={styles.statCard}>
          <ThemedText style={styles.statNumber}>23</ThemedText>
          <ThemedText style={styles.statLabel}>Saved Works</ThemedText>
        </Pressable>
        <Pressable style={styles.statCard}>
          <ThemedText style={styles.statNumber}>12</ThemedText>
          <ThemedText style={styles.statLabel}>Quests Done</ThemedText>
        </Pressable>
      </ThemedView>

      {/* Rank Progress */}
      <ThemedView style={styles.rankProgress}>
        <ThemedView style={styles.rankHeader}>
          <ThemedText style={styles.sectionTitle}>Rank Progress</ThemedText>
          <Pressable style={styles.helpButton}>
            <FontAwesome name="question" size={12} color="#666" />
          </Pressable>
        </ThemedView>
        <ThemedView style={styles.progressCard}>
          <ThemedView style={styles.rankLabels}>
            <ThemedText style={styles.currentRank}>Art Expert</ThemedText>
            <ThemedText style={styles.nextRank}>Art Master</ThemedText>
          </ThemedView>
          <ThemedView style={styles.progressBarBg}>
            <ThemedView style={[styles.progressBarFill, { width: "82%" }]} />
          </ThemedView>
          <ThemedText style={styles.xpNeeded}>
            551 XP needed for next rank
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Settings Section */}
      <ThemedView style={styles.settingsSection}>
        {/* Notifications */}
        <ThemedView style={styles.settingRow}>
          <ThemedView style={styles.settingLeft}>
            <FontAwesome name="bell" size={20} color="#666" />
            <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
          </ThemedView>
          <Switch value={true} onValueChange={() => {}} />
        </ThemedView>

        {/* Subscription */}
        <ThemedView style={styles.subscriptionCard}>
          <ThemedView style={styles.subscriptionHeader}>
            <ThemedView style={styles.settingLeft}>
              <FontAwesome name="crown" size={20} color="#666" />
              <ThemedText style={styles.settingLabel}>Subscription</ThemedText>
            </ThemedView>
            <ThemedView style={styles.planBadge}>
              <ThemedText style={styles.planText}>Free</ThemedText>
            </ThemedView>
          </ThemedView>
          <Pressable style={styles.upgradeButton}>
            <ThemedText style={styles.upgradeButtonText}>
              Upgrade to Premium
            </ThemedText>
          </Pressable>
          <Pressable style={styles.logoutButton}>
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    paddingBottom: 100, // Add extra padding at the bottom for tab bar
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  rankContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rankBadge: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  rankText: {
    color: "#fff",
    fontSize: 14,
  },
  xpText: {
    color: "#666",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  rankProgress: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  rankHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  helpButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#666",
    alignItems: "center",
    justifyContent: "center",
  },
  progressCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
  },
  rankLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  currentRank: {
    fontSize: 14,
  },
  nextRank: {
    fontSize: 14,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#333",
    borderRadius: 4,
  },
  xpNeeded: {
    fontSize: 14,
    color: "#666",
  },
  settingsSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 40,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  subscriptionCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planBadge: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  planText: {
    fontSize: 14,
  },
  upgradeButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
});
