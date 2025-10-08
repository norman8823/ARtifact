import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  FlatList,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { shadowStyle } from "@/constants/Shadow";
import { useUserData } from "@/src/hooks/useUserData";
import { Image } from "expo-image";

export default function ProfileSettingsScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState("Felix");
  const [tempSelectedSeed, setTempSelectedSeed] = useState("Felix");
  const { currentUser, ensureUserInDB, updateUserInDB } = useUserData();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    // phone: "",
    password: "password",
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
        name: currentUser.username || "",
        email: currentUser.email || "",
        // phone: currentUser.phone || "",
      }));

      // Set current avatar seed (stored in profileImage field) or default to Felix
      const currentSeed = currentUser.profileImage || "Felix";
      setSelectedAvatarSeed(currentSeed);
      setTempSelectedSeed(currentSeed);
    }
  }, [currentUser]);

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
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formField}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <ThemedView style={styles.inputContainer}>
            <FontAwesome
              name="envelope-o"
              size={16}
              color={Colors.darkMedGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </ThemedView>
        </ThemedView>

        {/* <ThemedView style={styles.formField}>
          <ThemedText style={styles.label}>Phone</ThemedText>
          <ThemedView style={styles.inputContainer}>
            <FontAwesome
              name="phone"
              size={16}
              color={Colors.darkMedGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="+1 555 123 4567"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </ThemedView>
        </ThemedView> */}

        <ThemedView style={[styles.formField, styles.lastFormField]}>
          <ThemedText style={styles.label}>Password</ThemedText>
          <ThemedView style={styles.inputContainer}>
            <FontAwesome
              name="lock"
              size={16}
              color={Colors.darkMedGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry={!showPassword}
              autoCapitalize="none"
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

        {/* Buttons */}
        <Pressable style={styles.saveButton}>
          <FontAwesome
            name="check"
            size={16}
            color={Colors.lightGray}
            style={styles.buttonIcon}
          />
          <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
        </Pressable>

        <Pressable style={styles.deleteButton}>
          <FontAwesome
            name="trash"
            size={16}
            color={Colors.darkMedGray}
            style={styles.buttonIcon}
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
                <ThemedText style={styles.saveModalButtonText}>
                  Save
                </ThemedText>
              </Pressable>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
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
    marginBottom: 36,
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
    marginBottom: 72,
  },
  label: {
    fontSize: 14,
    color: Colors.darkMedGray,
    marginBottom: 4,
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
    color: Colors.darkMedGray,
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
