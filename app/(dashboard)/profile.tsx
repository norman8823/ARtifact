import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useFavoritesContext } from "@/src/contexts/FavoritesContext";
import { useAuth } from "@/src/hooks/useAuth";
import { useFavoriteArtworks } from "@/src/hooks/useFavoriteArtworks";
import { useUserData } from "@/src/hooks/useUserData";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ProfileScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { signOut, isLoading } = useAuth();
  const { currentUser, ensureUserInDB } = useUserData();
  const { getFavoriteCount } = useFavoriteArtworks();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const { lastRefreshTime } = useFavoritesContext();

  // Load user data and favorite count when component mounts or favorites change
  useEffect(() => {
    const loadData = async () => {
      try {
        await ensureUserInDB();
        const count = await getFavoriteCount();
        setFavoriteCount(count);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [ensureUserInDB, getFavoriteCount, lastRefreshTime]); // Add lastRefreshTime as dependency

  const handleLogout = async () => {
    console.log("Logout button pressed");
    try {
      console.log("Calling sign out...");
      await signOut();
      console.log("Sign out completed, redirecting to login screen...");
      router.replace("/");
    } catch (error: any) {
      console.error("Logout error in profile screen:", error);
      Alert.alert(
        "Logout Error",
        error.message || "An error occurred while logging out"
      );
    }
  };

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
        <ThemedText style={styles.userName}>
          {currentUser?.username || "Loading..."}
        </ThemedText>
        <ThemedView style={styles.rankContainer}>
          <ThemedView style={styles.rankBadge}>
            <ThemedText style={styles.rankText}>Art Expert</ThemedText>
          </ThemedView>
          <ThemedText style={styles.xpText}>2,450 XP</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Stats Grid */}
      <ThemedView style={styles.statsGrid}>
        <Pressable
          style={styles.statCard}
          onPress={() => router.push("/artworksVisited")}
        >
          <ThemedText style={styles.statNumber}>47</ThemedText>
          <ThemedText style={styles.statLabel}>Artworks Visited</ThemedText>
        </Pressable>
        <Pressable
          style={styles.statCard}
          onPress={() => router.push("/favorites")}
        >
          <ThemedText style={styles.statNumber}>{favoriteCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Favorites</ThemedText>
        </Pressable>
        <Pressable
          style={styles.statCard}
          onPress={() => router.push("/questsCompleted")}
        >
          <ThemedText style={styles.statNumber}>12</ThemedText>
          <ThemedText style={styles.statLabel}>Quests Completed</ThemedText>
        </Pressable>
      </ThemedView>

      {/* Rank Progress */}
      <ThemedView style={styles.rankProgress}>
        <ThemedView style={styles.rankHeader}>
          <ThemedText style={styles.sectionTitle}>Rank Progress</ThemedText>
          <Pressable
            style={styles.helpButton}
            onPress={() => setIsModalVisible(true)}
          >
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
              <FontAwesome name="star" size={20} color="#666" />
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
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <ThemedText style={styles.logoutButtonText}>
              {isLoading ? "Logging out..." : "Logout"}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>

      {/* Simple Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <ThemedView style={styles.modalHeader}>
              <ThemedView style={styles.modalHeaderLeft}>
                <FontAwesome name="th-list" size={16} color="#666666" />
                <ThemedText style={styles.modalTitle}>Rank Levels</ThemedText>
              </ThemedView>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <FontAwesome name="times" size={20} color="#666666" />
              </Pressable>
            </ThemedView>

            {/* Rank List */}
            <ThemedView style={styles.rankList}>
              {/* Art Rookie */}
              <ThemedView style={styles.rankItem}>
                <ThemedView style={styles.rankIcon}>
                  <FontAwesome name="leaf" size={16} color="#666666" />
                </ThemedView>
                <ThemedView style={styles.rankDetails}>
                  <ThemedText style={styles.rankName}>Art Rookie</ThemedText>
                  <ThemedText style={styles.rankXP}>0-500 XP</ThemedText>
                  <ThemedText style={styles.rankDescription}>
                    Begin your journey and start discovering art!
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              {/* Art Enthusiast */}
              <ThemedView style={styles.rankItem}>
                <ThemedView style={styles.rankIcon}>
                  <FontAwesome name="paint-brush" size={16} color="#666666" />
                </ThemedView>
                <ThemedView style={styles.rankDetails}>
                  <ThemedText style={styles.rankName}>
                    Art Enthusiast
                  </ThemedText>
                  <ThemedText style={styles.rankXP}>501-1,500 XP</ThemedText>
                  <ThemedText style={styles.rankDescription}>
                    You're building a collection and learning fast.
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              {/* Art Expert */}
              <ThemedView style={styles.rankItem}>
                <ThemedView
                  style={[styles.rankIcon, styles.rankIconHighlighted]}
                >
                  <FontAwesome name="star" size={16} color="#FFFFFF" />
                </ThemedView>
                <ThemedView style={styles.rankDetails}>
                  <ThemedText style={styles.rankName}>Art Expert</ThemedText>
                  <ThemedText style={styles.rankXP}>1,501-3,000 XP</ThemedText>
                  <ThemedText style={styles.rankDescription}>
                    Recognized for your knowledge and dedication.
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              {/* Art Master */}
              <ThemedView style={styles.rankItem}>
                <ThemedView style={styles.rankIcon}>
                  <FontAwesome name="trophy" size={16} color="#666666" />
                </ThemedView>
                <ThemedView style={styles.rankDetails}>
                  <ThemedText style={styles.rankName}>Art Master</ThemedText>
                  <ThemedText style={styles.rankXP}>3,001+ XP</ThemedText>
                  <ThemedText style={styles.rankDescription}>
                    You're a true master—share your love of art with all!
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: "#f5f5f5",
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
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    backgroundColor: "#f5f5f5",
  },
  subscriptionCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  subscriptionHeader: {
    backgroundColor: "#f5f5f5",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rankList: {
    gap: 16,
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  rankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  rankIconHighlighted: {
    backgroundColor: "#111111",
  },
  rankDetails: {
    flex: 1,
  },
  rankName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  rankXP: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  rankDescription: {
    fontSize: 12,
    color: "#666666",
  },
});
