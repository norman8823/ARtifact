import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { PaywallModal } from "@/components/PaywallModal";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { useEntitlementContext } from "@/src/contexts/EntitlementContext";
import { useAccountDeletion } from "@/src/hooks/useAccountDeletion";
import { useProfileUpdate } from "@/src/hooks/useProfileUpdate";
import { useUserData } from "@/src/hooks/useUserData";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export default function ProfileSettingsScreen() {
  const {
    isEntitled,
    isPurchaseOffered,
    priceLabel,
    isPurchasing,
    isRestoring,
    entitlement,
    purchase,
    restore,
  } = useEntitlementContext();
  const [showPaywall, setShowPaywall] = useState(false);
  const { signOut } = useAuthContext();
  const { deleteAccount, isDeleting } = useAccountDeletion();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleConfirmDelete = async () => {
    const result = await deleteAccount();
    setShowDeleteModal(false);

    if (result.ok) {
      // The Cognito user is gone; drop local session + cached data. The auth
      // state change navigates away on its own.
      await signOut();
      Alert.alert(
        "Account Deleted",
        "Your account and all associated data have been permanently deleted."
      );
      return;
    }

    // Deliberately reassuring: on a data failure we kept the account, so
    // nothing was lost and retrying is safe.
    Alert.alert(
      result.reason === "data-incomplete"
        ? "Account Not Deleted"
        : "Deletion Failed",
      result.message
    );
  };


  // App Review tests Restore and rejects a silent no-op, so every outcome gets
  // a distinct, plain-language alert.
  const handleRestore = async () => {
    const outcome = await restore();
    if (outcome === "restored") {
      Alert.alert("Purchase Restored", "ARtifact Premium is active on this device.");
    } else if (outcome === "nothing-to-restore") {
      Alert.alert(
        "Nothing to Restore",
        "No previous purchase was found for this Apple ID."
      );
    } else {
      Alert.alert(
        "App Store Unavailable",
        "Couldn't reach the App Store. Check your connection and try again."
      );
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState("Felix");
  const [tempSelectedSeed, setTempSelectedSeed] = useState("Felix");
  const { currentUser, ensureUserInDB, updateUserInDB } = useUserData();
  const { updateProfile, isUpdating } = useProfileUpdate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data on mount
  useEffect(() => {
    ensureUserInDB();
  }, [ensureUserInDB]);

  // Generate avatar options based on user ID/email
  const generateAvatarSeeds = () => {
    const baseSeeds = ["Felix"]; // Default option first
    if (currentUser?.id) {
      baseSeeds.push(
        currentUser.id,
        `${currentUser.id}-1`,
        `${currentUser.id}-2`,
        `${currentUser.id}-3`,
        `${currentUser.id}-art`,
        `${currentUser.id}-quest`,
        `${currentUser.id}-museum`
      );
    }
    if (currentUser?.email) {
      baseSeeds.push(
        currentUser.email,
        `${currentUser.email}-variant`,
        `${currentUser.email}-alt`,
        `${currentUser.email}-creative`
      );
    }
    // Take first 12 unique seeds
    return [...new Set(baseSeeds)].slice(0, 12);
  };

  // Update formData when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        username: currentUser.username || "",
        email: currentUser.email || "",
      }));

      // Set current avatar seed (stored in profileImage field) or default to Felix
      const currentSeed = currentUser.profileImage || "Felix";
      setSelectedAvatarSeed(currentSeed);
      setTempSelectedSeed(currentSeed);
    }
  }, [currentUser]);

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!currentUser?.id) {
      Alert.alert("Error", "User information not loaded");
      return;
    }

    // Check if any changes were made
    const usernameChanged = formData.username !== currentUser.username;
    const passwordChanged = formData.newPassword.trim().length > 0;

    if (!usernameChanged && !passwordChanged) {
      Alert.alert("No Changes", "You haven't made any changes to save");
      return;
    }

    // Validate password fields if password is being changed
    if (passwordChanged) {
      if (!formData.currentPassword) {
        Alert.alert(
          "Current Password Required",
          "Please enter your current password to change it"
        );
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        Alert.alert(
          "Passwords Don't Match",
          "New password and confirm password must match"
        );
        return;
      }

      if (formData.newPassword.length < 8) {
        Alert.alert(
          "Invalid Password",
          "Password must be at least 8 characters long"
        );
        return;
      }
    }

    try {
      const updateParams: {
        username?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};

      if (usernameChanged) {
        updateParams.username = formData.username.trim();
      }

      if (passwordChanged) {
        updateParams.currentPassword = formData.currentPassword;
        updateParams.newPassword = formData.newPassword;
      }

      const result = await updateProfile(
        updateParams,
        currentUser.id,
        currentUser.username,
        updateUserInDB
      );

      // Clear password fields after successful update
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      // Show success message
      const updatedFieldsText = result.updatedFields.join(" and ");
      Alert.alert(
        "Success",
        `Your ${updatedFieldsText} ${
          result.updatedFields.length > 1 ? "have" : "has"
        } been updated successfully`
      );
    } catch (error: any) {
      console.error("Error saving changes:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to save changes. Please try again."
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <ThemedView style={styles.avatarBlock}>
          <View style={styles.avatarContainer}>
            <Pressable onPress={() => setShowPhotoModal(true)}>
              <Image
                source={{
                  uri: `https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=${selectedAvatarSeed}`,
                }}
                style={styles.avatar}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setShowPhotoModal(true)}
                style={styles.editAvatarButton}
              >
                <FontAwesome
                  name="pencil"
                  size={12}
                  color={Colors.darkMedGray}
                />
              </Pressable>
            </Pressable>
          </View>
        </ThemedView>

        {/* Form Fields */}
        <ThemedView style={styles.formField}>
          <ThemedText style={styles.label}>Username</ThemedText>
          <ThemedView style={styles.inputContainer}>
            <FontAwesome
              name="user-o"
              size={16}
              color={Colors.darkMedGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              value={formData.username}
              onChangeText={(text) =>
                setFormData({ ...formData, username: text })
              }
              autoCapitalize="none"
              editable={!isUpdating}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formField}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <ThemedView style={[styles.inputContainer, styles.readOnlyInput]}>
            <FontAwesome
              name="envelope-o"
              size={16}
              color={Colors.darkMedGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.readOnlyText]}
              value={formData.email}
              editable={false}
            />
          </ThemedView>
          <ThemedText style={styles.helperText}>
            Email cannot be changed
          </ThemedText>
        </ThemedView>

        {/* Password Change Section */}
        <ThemedView style={styles.passwordSection}>
          <ThemedText style={styles.sectionTitle}>Change Password</ThemedText>

          <ThemedView style={styles.formField}>
            <ThemedText style={styles.label}>Current Password</ThemedText>
            <ThemedView style={styles.inputContainer}>
              <FontAwesome
                name="lock"
                size={16}
                color={Colors.darkMedGray}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                value={formData.currentPassword}
                onChangeText={(text) =>
                  setFormData({ ...formData, currentPassword: text })
                }
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isUpdating}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome
                  name={showPassword ? "eye" : "eye-slash"}
                  size={16}
                  color={Colors.darkMedGray}
                />
              </Pressable>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.formField}>
            <ThemedText style={styles.label}>New Password</ThemedText>
            <ThemedView style={styles.inputContainer}>
              <FontAwesome
                name="lock"
                size={16}
                color={Colors.darkMedGray}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                value={formData.newPassword}
                onChangeText={(text) =>
                  setFormData({ ...formData, newPassword: text })
                }
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={!isUpdating}
              />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                <FontAwesome
                  name={showNewPassword ? "eye" : "eye-slash"}
                  size={16}
                  color={Colors.darkMedGray}
                />
              </Pressable>
            </ThemedView>
          </ThemedView>

          <ThemedView style={[styles.formField, styles.lastFormField]}>
            <ThemedText style={styles.label}>Confirm New Password</ThemedText>
            <ThemedView style={styles.inputContainer}>
              <FontAwesome
                name="lock"
                size={16}
                color={Colors.darkMedGray}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChangeText={(text) =>
                  setFormData({ ...formData, confirmPassword: text })
                }
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isUpdating}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesome
                  name={showConfirmPassword ? "eye" : "eye-slash"}
                  size={16}
                  color={Colors.darkMedGray}
                />
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Purchases */}
        <ThemedView style={styles.passwordSection}>
          <ThemedText style={styles.sectionTitle}>Purchases</ThemedText>

          <ThemedView style={styles.purchaseRow}>
            <ThemedText style={styles.purchaseLabel}>ARtifact Premium</ThemedText>
            <ThemedView
              style={[
                styles.purchaseBadge,
                isEntitled ? styles.purchaseBadgeActive : styles.purchaseBadgeInactive,
              ]}
            >
              <ThemedText
                style={[
                  styles.purchaseBadgeText,
                  isEntitled
                    ? styles.purchaseBadgeTextActive
                    : styles.purchaseBadgeTextInactive,
                ]}
              >
                {isEntitled ? "Active" : "Not purchased"}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {isPurchaseOffered && (
            <Pressable
              style={styles.purchaseButton}
              onPress={() => setShowPaywall(true)}
              disabled={isPurchasing || isRestoring}
            >
              <ThemedText style={styles.purchaseButtonText}>
                Unlock All Quests
                {priceLabel ? ` \u00b7 ${priceLabel}` : ""}
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            style={styles.purchaseButton}
            onPress={handleRestore}
            disabled={isRestoring || isPurchasing}
          >
            {isRestoring ? (
              <ActivityIndicator color={Colors.darkMedGray} />
            ) : (
              <ThemedText style={styles.purchaseButtonText}>
                Restore Purchases
              </ThemedText>
            )}
          </Pressable>
        </ThemedView>

        {/* Buttons */}
        <Pressable
          style={[styles.saveButton, isUpdating && styles.disabledButton]}
          onPress={handleSaveChanges}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color={Colors.lightGray} />
          ) : (
            <>
              <FontAwesome
                name="check"
                size={16}
                color={Colors.lightGray}
                style={styles.buttonIcon}
              />
              <ThemedText style={styles.saveButtonText}>
                Save Changes
              </ThemedText>
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={() => setShowDeleteModal(true)}
          disabled={isUpdating || isDeleting}
        >
          <FontAwesome
            name="trash"
            size={16}
            color={Colors.darkMedGray}
            style={styles.buttonIconTrashCan}
          />
          <ThemedText style={styles.deleteButtonText}>
            Delete Account
          </ThemedText>
        </Pressable>
      </ScrollView>

      {/* Avatar Selection Modal */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setTempSelectedSeed(selectedAvatarSeed);
          setShowPhotoModal(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setTempSelectedSeed(selectedAvatarSeed);
            setShowPhotoModal(false);
          }}
        >
          <Pressable
            style={styles.avatarModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <ThemedView style={styles.avatarModalHeader}>
              <ThemedText style={styles.avatarModalTitle}>
                Choose Your Avatar
              </ThemedText>
              <Pressable
                style={styles.closeButton}
                onPress={() => {
                  setTempSelectedSeed(selectedAvatarSeed);
                  setShowPhotoModal(false);
                }}
              >
                <FontAwesome
                  name="times"
                  size={20}
                  color={Colors.darkMedGray}
                />
              </Pressable>
            </ThemedView>

            {/* Avatar Grid */}
            <ScrollView
              style={styles.avatarGrid}
              contentContainerStyle={styles.avatarGridContent}
              showsVerticalScrollIndicator={false}
            >
              <ThemedView style={styles.avatarGridContainer}>
                {generateAvatarSeeds().map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.avatarOption,
                      tempSelectedSeed === item && styles.selectedAvatarOption,
                    ]}
                    onPress={() => setTempSelectedSeed(item)}
                  >
                    <Image
                      source={{
                        uri: `https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=${item}`,
                      }}
                      style={styles.avatarOptionImage}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ThemedView>
            </ScrollView>

            {/* Action Buttons */}
            <ThemedView style={styles.modalActions}>
              <Pressable
                style={styles.cancelModalButton}
                onPress={() => {
                  setTempSelectedSeed(selectedAvatarSeed);
                  setShowPhotoModal(false);
                }}
              >
                <ThemedText style={styles.cancelModalButtonText}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                style={styles.saveModalButton}
                onPress={async () => {
                  try {
                    if (currentUser?.id) {
                      await updateUserInDB(currentUser.id, {
                        profileImage: tempSelectedSeed,
                      });
                    }
                    setSelectedAvatarSeed(tempSelectedSeed);
                    setShowPhotoModal(false);
                  } catch (error) {
                    console.error("Failed to save avatar:", error);
                    // Could add error handling/toast here
                  }
                }}
              >
                <ThemedText style={styles.saveModalButtonText}>Save</ThemedText>
              </Pressable>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>


      {/* Step 2 of 2: type-to-confirm. An irreversible action shouldn't be one
          mistap away, and Apple requires deletion to be deliberate. */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <ThemedView style={styles.deleteModalOverlay}>
          <ThemedView style={styles.deleteModalCard}>
            <ThemedText type="subtitle" style={styles.deleteModalTitle}>
              Permanently delete account?
            </ThemedText>
            <ThemedText style={styles.deleteModalBody}>
              This erases your XP, rank, favorites, visited artworks and quest
              progress. It cannot be undone.
            </ThemedText>
            <ThemedView style={styles.deleteModalButtons}>
              <Pressable
                style={styles.deleteModalCancel}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <ThemedText style={styles.deleteModalCancelText}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.deleteModalConfirm,
                  isDeleting && styles.disabledButton,
                ]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={Colors.lightGray} />
                ) : (
                  <ThemedText style={styles.deleteModalConfirmText}>
                    Delete Account
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        context="quest-locked"
        priceLabel={priceLabel}
        isPurchasing={isPurchasing}
        isRestoring={isRestoring}
        canPurchase={entitlement !== "unknown" || priceLabel !== null}
        onUnlock={() => {
          void purchase().catch(() => {
            // Surfaced by the purchase error listener.
          });
        }}
        onRestore={handleRestore}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  avatarBlock: {
    alignItems: "center",
    marginBottom: 15,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.medLightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.medLightGray,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.darkMedGray,
  },
  formField: {
    marginBottom: 12,
  },
  lastFormField: {
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    color: Colors.darkMedGray,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.darkMedGray,
    marginTop: 4,
    marginBottom: 5,
    fontStyle: "italic",
  },
  readOnlyInput: {
    opacity: 0.6,
  },
  readOnlyText: {
    color: Colors.darkMedGray,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deleteModalCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    padding: 24,
  },
  deleteModalTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  deleteModalBody: {
    fontSize: 14,
    color: Colors.darkMedGray,
    marginBottom: 12,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  deleteModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.darkMedGray,
    alignItems: "center",
  },
  deleteModalCancelText: {
    color: Colors.darkMedGray,
    fontSize: 16,
  },
  deleteModalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.metRed,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  deleteModalConfirmText: {
    color: Colors.lightGray,
    fontSize: 16,
  },
  purchaseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 12,
  },
  purchaseLabel: {
    fontSize: 15,
  },
  purchaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  purchaseBadgeActive: {
    backgroundColor: Colors.lightGreen,
  },
  purchaseBadgeInactive: {
    backgroundColor: Colors.medLightGray,
  },
  purchaseBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  purchaseBadgeTextActive: {
    color: Colors.darkGreen,
  },
  purchaseBadgeTextInactive: {
    color: Colors.darkMedGray,
  },
  purchaseButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.medGray,
    alignItems: "center",
    marginBottom: 8,
  },
  purchaseButtonText: {
    color: Colors.darkGray,
    fontSize: 15,
  },
  passwordSection: {
    marginBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.medGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.darkMedGray,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...shadowStyle,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Colors.darkMedGray,
    paddingVertical: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonIconTrashCan: {
    marginRight: 8,
    color: "#FF3B30",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    ...shadowStyle,
  },
  saveButtonText: {
    color: Colors.lightGray,
  },
  disabledButton: {
    opacity: 0.5,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    paddingVertical: 16,
    ...shadowStyle,
  },
  deleteButtonText: {
    color: "#FF3B30",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarModalContent: {
    backgroundColor: Colors.lightGray,
    borderRadius: 16,
    width: "85%",
    maxWidth: 340,
    paddingBottom: 16,
    marginHorizontal: 20,
    overflow: "hidden",
  },
  avatarModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  avatarModalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGrid: {
    paddingHorizontal: 16,
    maxHeight: 360,
  },
  avatarGridContent: {
    paddingBottom: 16,
  },
  avatarGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignItems: "center",
  },
  avatarOption: {
    width: 70,
    height: 70,
    margin: 6,
    borderRadius: 35,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.medLightGray,
    borderWidth: 2,
    borderColor: Colors.medGray,
  },
  selectedAvatarOption: {
    borderWidth: 3,
    borderColor: Colors.darkGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarOptionImage: {
    width: "100%",
    height: "100%",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    ...shadowStyle,
  },
  cancelModalButtonText: {
    color: Colors.darkMedGray,
    fontSize: 16,
  },
  saveModalButton: {
    flex: 1,
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    ...shadowStyle,
  },
  saveModalButtonText: {
    color: Colors.lightGray,
    fontSize: 16,
  },
});
