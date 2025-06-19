import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useFavoritesContext } from "@/src/contexts/FavoritesContext";
import { useAuth } from "@/src/hooks/useAuth";
import { useFavoriteArtworks } from "@/src/hooks/useFavoriteArtworks";
import { type Rank, useRanks } from "@/src/hooks/useRanks";
import { useUserData } from "@/src/hooks/useUserData";
import { type UserQuest, useUserQuests } from "@/src/hooks/useUserQuests";
import { type UserXP, useUserXP } from "@/src/hooks/useUserXP";
import { useVisited } from "@/src/hooks/useVisited";
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
import { Colors } from "../../constants/Colors";
import { SafeAreaView } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ProfileScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { signOut, isLoading } = useAuth();
  const { currentUser, ensureUserInDB } = useUserData();
  const { getFavoriteCount } = useFavoriteArtworks();
  const { getVisitedArtworks } = useVisited();
  const { getUserQuests } = useUserQuests();
  const { getUserXP } = useUserXP();
  const { getRankByXP, getAllRanks } = useRanks();
  const { lastRefreshTime } = useFavoritesContext();

  const [favoriteCount, setFavoriteCount] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [completedQuestsCount, setCompletedQuestsCount] = useState(0);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [currentRank, setCurrentRank] = useState<Rank | null>(null);
  const [nextRank, setNextRank] = useState<Rank | null>(null);
  const [xpProgress, setXpProgress] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(0);

  // Load user data and stats when component mounts or favorites change
  useEffect(() => {
    const loadData = async () => {
      try {
        await ensureUserInDB();

        // Load all data in parallel
        const [favorites, visited, quests, xp, allRanks] = await Promise.all([
          getFavoriteCount(),
          getVisitedArtworks(),
          getUserQuests(),
          getUserXP(),
          getAllRanks(),
        ]);

        // Update counts
        setFavoriteCount(favorites);
        setVisitedCount(visited.length);
        setCompletedQuestsCount(
          quests.filter((q: UserQuest) => q.isCompleted).length
        );
        setUserXP(xp);

        // Calculate rank progress
        if (xp && allRanks.length > 0) {
          const userRank = allRanks.find(
            (rank: Rank) =>
              xp.xpPoints >= rank.minXP && xp.xpPoints <= rank.maxXP
          );
          const nextRankIndex =
            allRanks.findIndex((r: Rank) => r.id === userRank?.id) + 1;
          const nextUserRank =
            nextRankIndex < allRanks.length ? allRanks[nextRankIndex] : null;

          setCurrentRank(userRank || allRanks[0]);
          setNextRank(nextUserRank);

          if (userRank && nextUserRank) {
            const totalXPInLevel = nextUserRank.minXP - userRank.minXP;
            const userXPInLevel = xp.xpPoints - userRank.minXP;
            const progress = (userXPInLevel / totalXPInLevel) * 100;
            const needed = nextUserRank.minXP - xp.xpPoints;

            setXpProgress(progress);
            setXpNeeded(needed);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [
    ensureUserInDB,
    getFavoriteCount,
    getVisitedArtworks,
    getUserQuests,
    getUserXP,
    getAllRanks,
    lastRefreshTime,
  ]);

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
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>
              Profile
            </ThemedText>
            <Pressable
              style={styles.settingsButton}
              onPress={() => router.push("/profileSettings")}
            >
              <FontAwesome name="gear" size={24} color={Colors.darkMedGray} />
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
                <ThemedText style={styles.rankText}>
                  {currentRank?.title || "Loading..."}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.xpText}>
                {userXP?.xpPoints || 0} XP
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Stats Grid */}
          <ThemedView style={styles.statsGrid}>
            <Pressable
              style={styles.statCard}
              onPress={() => router.push("/artworksVisited")}
            >
              <ThemedText style={styles.statNumber}>{visitedCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Artworks</ThemedText>
              <ThemedText style={styles.statLabel}>Visited</ThemedText>
            </Pressable>
            <Pressable
              style={styles.statCard}
              onPress={() => router.push("/favorites")}
            >
              <ThemedText style={styles.statNumber}>{favoriteCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Favorite</ThemedText>
              <ThemedText style={styles.statLabel}>Artworks</ThemedText>
            </Pressable>
            <Pressable
              style={styles.statCard}
              onPress={() => router.push("/questsCompleted")}
            >
              <ThemedText style={styles.statNumber}>
                {completedQuestsCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Quests</ThemedText>
              <ThemedText style={styles.statLabel}>Completed</ThemedText>
            </Pressable>
          </ThemedView>

          {/* Rank Progress */}
          <ThemedView style={styles.rankProgress}>
            <ThemedView style={styles.rankHeader}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Rank Progress
              </ThemedText>
              <Pressable
                style={styles.helpButton}
                onPress={() => setIsModalVisible(true)}
              >
                <FontAwesome
                  name="question"
                  size={12}
                  color={Colors.darkMedGray}
                />
              </Pressable>
            </ThemedView>
            <ThemedView style={styles.progressCard}>
              <ThemedView style={styles.rankLabels}>
                <ThemedText style={styles.currentRank}>
                  {currentRank?.title || "Loading..."}
                </ThemedText>
                <ThemedText style={styles.nextRank}>
                  {nextRank?.title || "Max Rank"}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.progressBarBg}>
                <ThemedView
                  style={[styles.progressBarFill, { width: `${xpProgress}%` }]}
                />
              </ThemedView>
              <ThemedText style={styles.xpNeeded}>
                {nextRank
                  ? `${xpNeeded} XP needed for next rank`
                  : "Max rank achieved!"}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Settings Section */}
          <ThemedView style={styles.settingsSection}>
            {/* Notifications */}
            <ThemedView style={styles.settingRow}>
              <ThemedView style={styles.settingLeft}>
                <FontAwesome name="bell" size={20} color={Colors.darkMedGray} />
                <ThemedText style={styles.settingLabel}>
                  Notifications
                </ThemedText>
              </ThemedView>
              <Switch value={true} onValueChange={() => {}} />
            </ThemedView>

            {/* Logout Button */}
            <ThemedView style={styles.logoutButtonWrapper}>
              <Pressable onPress={handleLogout} disabled={isLoading}>
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
                    <FontAwesome
                      name="th-list"
                      size={16}
                      color={Colors.darkMedGray}
                    />
                    <ThemedText style={styles.modalTitle}>
                      Rank Levels
                    </ThemedText>
                  </ThemedView>
                  <Pressable
                    style={styles.closeButton}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <FontAwesome
                      name="times"
                      size={20}
                      color={Colors.darkMedGray}
                    />
                  </Pressable>
                </ThemedView>

                {/* Rank List */}
                <ThemedView style={styles.rankList}>
                  {/* Art Rookie */}
                  <ThemedView style={styles.rankItem}>
                    <ThemedView style={styles.rankIcon}>
                      <FontAwesome
                        name="leaf"
                        size={16}
                        color={Colors.darkYellow}
                      />
                    </ThemedView>
                    <ThemedView style={styles.rankDetails}>
                      <ThemedText style={styles.rankName}>
                        Art Rookie
                      </ThemedText>
                      <ThemedText style={styles.rankXP}>0-500 XP</ThemedText>
                      <ThemedText style={styles.rankDescription}>
                        Begin your journey and start discovering art!
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  {/* Art Enthusiast */}
                  <ThemedView style={styles.rankItem}>
                    <ThemedView style={styles.rankIcon}>
                      <FontAwesome
                        name="paint-brush"
                        size={16}
                        color={Colors.darkYellow}
                      />
                    </ThemedView>
                    <ThemedView style={styles.rankDetails}>
                      <ThemedText style={styles.rankName}>
                        Art Enthusiast
                      </ThemedText>
                      <ThemedText style={styles.rankXP}>
                        501-1,500 XP
                      </ThemedText>
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
                      <FontAwesome
                        name="star"
                        size={16}
                        color={Colors.darkYellow}
                      />
                    </ThemedView>
                    <ThemedView style={styles.rankDetails}>
                      <ThemedText style={styles.rankName}>
                        Art Expert
                      </ThemedText>
                      <ThemedText style={styles.rankXP}>
                        1,501-3,000 XP
                      </ThemedText>
                      <ThemedText style={styles.rankDescription}>
                        Recognized for your knowledge and dedication.
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  {/* Art Master */}
                  <ThemedView style={styles.rankItem}>
                    <ThemedView style={styles.rankIcon}>
                      <FontAwesome
                        name="trophy"
                        size={16}
                        color={Colors.darkYellow}
                      />
                    </ThemedView>
                    <ThemedView style={styles.rankDetails}>
                      <ThemedText style={styles.rankName}>
                        Art Master
                      </ThemedText>
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
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 30,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.medLightGray,
    borderWidth: 1,
    borderColor: Colors.darkMedGray,
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
    backgroundColor: Colors.medLightGray,
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    marginBottom: 8,
  },
  rankContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rankBadge: {
    backgroundColor: Colors.lightYellow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.darkYellow,
  },
  rankText: {
    fontSize: 14,
    color: Colors.darkYellow,
  },
  xpText: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  statCard: {
    backgroundColor: Colors.medLightGray,
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    color: Colors.darkMedGray,
  },
  rankProgress: {
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  rankHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  helpButton: {
    backgroundColor: Colors.medLightGray,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.darkMedGray,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCard: {
    backgroundColor: Colors.medLightGray,
    padding: 16,
    borderRadius: 12,
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  rankLabels: {
    backgroundColor: Colors.medLightGray,
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
    backgroundColor: Colors.medGray,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.lightYellow,
    borderRadius: 4,
  },
  xpNeeded: {
    fontSize: 14,
    color: Colors.darkMedGray,
  },
  settingsSection: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 40,
  },
  settingRow: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  settingLeft: {
    backgroundColor: Colors.medLightGray,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  logoutButtonWrapper: {
    backgroundColor: Colors.medLightGray,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 340,
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
    alignItems: "center",
    justifyContent: "center",
  },
  rankIconHighlighted: {
    backgroundColor: Colors.lightYellow,
    borderColor: Colors.darkYellow,
    borderWidth: 1,
  },
  rankDetails: {
    flex: 1,
  },
  rankName: {
    fontSize: 16,
    marginBottom: 2,
  },
  rankXP: {
    fontSize: 14,
    color: Colors.darkMedGray,
    marginBottom: 4,
  },
  rankDescription: {
    fontSize: 12,
    color: Colors.darkMedGray,
  },
});
