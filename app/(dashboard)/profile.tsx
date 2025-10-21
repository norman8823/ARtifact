import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { useAuthContext } from "@/src/contexts/AuthContext";
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
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ProfileScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { signOut: authHookSignOut, isLoading } = useAuth();
  const { isAuthReady, isAuthenticated, signOut: contextSignOut } = useAuthContext();
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
  const [allRanks, setAllRanks] = useState<Rank[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load user data and stats
  const loadData = useCallback(async () => {
    // Don't load data if not authenticated
    if (!isAuthReady || !isAuthenticated) {
      console.log("⚠️ Profile: Skipping data load - user not authenticated");
      return;
    }

    try {
      await ensureUserInDB();

      // Load all data in parallel
      const [favorites, visited, quests, xp, ranks] = await Promise.all([
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
      setAllRanks(ranks);

      // Calculate rank progress
      if (xp && ranks.length > 0) {
        const userRank = ranks.find(
          (rank: Rank) => xp.xpPoints >= rank.minXP && xp.xpPoints <= rank.maxXP
        );
        const nextRankIndex =
          ranks.findIndex((r: Rank) => r.id === userRank?.id) + 1;
        const nextUserRank =
          nextRankIndex < ranks.length ? ranks[nextRankIndex] : null;

        setCurrentRank(userRank || ranks[0]);
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

      console.log("📊 Profile data refreshed:", {
        visitedCount: visited.length,
        xpPoints: xp?.xpPoints || 0,
        favoriteCount: favorites,
        completedQuests: quests.filter((q: UserQuest) => q.isCompleted).length,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [
    isAuthReady,
    isAuthenticated,
    ensureUserInDB,
    getFavoriteCount,
    getVisitedArtworks,
    getUserQuests,
    getUserXP,
    getAllRanks,
  ]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadData]);

  // Redirect to login if not authenticated (check this FIRST)
  useEffect(() => {
    console.log("🔍 Profile: Auth state check - isAuthReady:", isAuthReady, "isAuthenticated:", isAuthenticated);
    if (isAuthReady && !isAuthenticated) {
      console.log("🚪 User not authenticated in Profile, redirecting to login");
      router.replace("/");
    }
  }, [isAuthReady, isAuthenticated]);

  // Load data when component mounts or favorites change (only if authenticated)
  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      loadData();
    }
  }, [loadData, lastRefreshTime, isAuthReady, isAuthenticated]);

  // Refresh data when screen comes into focus (e.g., after scanning)
  useFocusEffect(
    useCallback(() => {
      if (isAuthReady && isAuthenticated) {
        console.log("🔄 Profile screen focused - refreshing data");
        loadData();
      }
    }, [loadData, isAuthReady, isAuthenticated])
  );

  const handleLogout = async () => {
    console.log("Logout button pressed");
    try {
      console.log("Calling AuthContext sign out...");
      await contextSignOut();
      console.log("Sign out completed");
      // Don't manually redirect - the useEffect will handle it when isAuthenticated becomes false
    } catch (error: any) {
      console.error("Logout error in profile screen:", error);
      Alert.alert(
        "Logout Error",
        error.message || "An error occurred while logging out"
      );
    }
  };

  // Show loading state while auth is initializing or during logout
  if (!isAuthReady || (isAuthReady && !isAuthenticated)) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: Colors.lightGray }, { justifyContent: "center", alignItems: "center" }]}>
        <ThemedText>Loading...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.lightGray }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.darkMedGray}
              colors={[Colors.darkMedGray]}
            />
          }
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
                uri: `https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=${currentUser?.profileImage || "Felix"}`,
              }}
              style={styles.avatar}
            />
            <ThemedText style={styles.userName}>
              {currentUser?.username || "Loading..."}
            </ThemedText>
            <ThemedView style={styles.rankContainer}>
              <FontAwesome
                name={(currentRank?.icon as any) || "trophy"}
                size={16}
                color={Colors.darkYellow}
              />
              <ThemedText style={styles.rankText}>
                {currentRank?.title || "Loading..."}
              </ThemedText>
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
                  style={[
                    styles.progressBarFill,
                    { width: nextRank ? `${xpProgress}%` : '100%' },
                    !nextRank && styles.progressBarMaxRank
                  ]}
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
            {/* <ThemedView style={styles.settingRow}>
              <ThemedView style={styles.settingLeft}>
                <FontAwesome name="bell" size={20} color={Colors.darkMedGray} />
                <ThemedText style={styles.settingLabel}>
                  Notifications
                </ThemedText>
              </ThemedView>
              <Switch value={true} onValueChange={() => {}} />
            </ThemedView> */}

            {/* Logout Button */}
            <Pressable
              style={({ pressed }) => [
                styles.logoutButtonWrapper,
                pressed && styles.logoutButtonPressed
              ]}
              onPress={handleLogout}
              disabled={isLoading}
            >
              <ThemedText style={styles.logoutButtonText}>
                {isLoading ? "Logging out..." : "Logout"}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {/* Modal */}
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
                  {allRanks.map((rank, idx) => {
                    let iconName = "leaf";
                    if (rank.title.toLowerCase().includes("enthusiast"))
                      iconName = "paint-brush";
                    else if (rank.title.toLowerCase().includes("expert"))
                      iconName = "star";
                    else if (rank.title.toLowerCase().includes("master"))
                      iconName = "trophy";
                    else if (rank.title.toLowerCase().includes("legend"))
                      iconName = "diamond";
                    const isCurrent = currentRank?.id === rank.id;
                    const isLast = idx === allRanks.length - 1;
                    return (
                      <ThemedView key={rank.id} style={styles.rankItem}>
                        <ThemedView
                          style={[
                            styles.rankIcon,
                            isCurrent && styles.rankIconHighlighted,
                          ]}
                        >
                          <FontAwesome
                            name={iconName as any}
                            size={16}
                            color={Colors.darkYellow}
                          />
                        </ThemedView>
                        <ThemedView style={styles.rankDetails}>
                          <ThemedText style={styles.rankName}>
                            {rank.title}
                          </ThemedText>
                          <ThemedText style={styles.rankXP}>
                            {isLast
                              ? `${rank.minXP}+ XP`
                              : `${rank.minXP}-${rank.maxXP} XP`}
                          </ThemedText>
                          <ThemedText style={styles.rankDescription}>
                            {rank.description || ""}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    );
                  })}
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
    borderWidth: 2,
    borderColor: Colors.medGray,
  },
  userName: {
    fontSize: 20,
    marginBottom: 8,
  },
  rankContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  xpText: {
    fontSize: 16,
    fontWeight: "400",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    ...shadowStyle,
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
    ...shadowStyle,
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
  progressBarMaxRank: {
    backgroundColor: Colors.darkGreen,
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
  // settingRow: {
  //   backgroundColor: Colors.medLightGray,
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   padding: 16,
  //   borderRadius: 12,
  //   ...shadowStyle,
  // },
  // settingLeft: {
  //   backgroundColor: Colors.medLightGray,
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 12,
  // },
  // settingLabel: {
  //   fontSize: 16,
  // },
  logoutButtonWrapper: {
    backgroundColor: Colors.medLightGray,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    ...shadowStyle,
  },
  logoutButtonPressed: {
    shadowOpacity: 0,
    elevation: 0,
    transform: [{ translateY: 1 }],
  },
  logoutButtonText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
