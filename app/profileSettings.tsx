import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Colors } from "@/constants/Colors";

export default function ProfileSettingsScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "Sarah Johnson",
    phone: "+1 555 123 4567",
    email: "sarah@email.com",
    password: "password",
  });

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
              <ThemedView style={styles.avatar}>
                <ThemedText style={styles.avatarText}>SJ</ThemedText>
              </ThemedView>
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
          <ThemedText style={styles.label}>Name</ThemedText>
          <ThemedView style={styles.inputContainer}>
            <FontAwesome
              name="user-o"
              size={16}
              color={Colors.darkMedGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Sarah Johnson"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formField}>
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
              placeholder="sarah@email.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </ThemedView>
        </ThemedView>

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

      {/* Photo Selection Modal */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPhotoModal(false)}
        >
          <Pressable style={styles.modalContent}>
            <Pressable
              style={styles.modalButton}
              onPress={() => {
                // Handle photo library
                setShowPhotoModal(false);
              }}
            >
              <FontAwesome
                name="image"
                size={20}
                color={Colors.darkMedGray}
                style={styles.modalIcon}
              />
              <ThemedText style={styles.modalButtonText}>
                Photo Library
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.modalButton}
              onPress={() => {
                // Handle camera
                setShowPhotoModal(false);
              }}
            >
              <FontAwesome
                name="camera"
                size={20}
                color={Colors.darkMedGray}
                style={styles.modalIcon}
              />
              <ThemedText style={styles.modalButtonText}>Take Photo</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowPhotoModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>
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
  avatarText: {
    color: Colors.darkMedGray,
    fontSize: 28,
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
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
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
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
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
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
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
  modalContent: {
    backgroundColor: Colors.medLightGray,
    borderRadius: 12,
    width: "90%",
    maxWidth: 375,
    overflow: "hidden",
  },
  modalButton: {
    width: "100%",
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.medGray,
  },
  modalIcon: {
    marginRight: 12,
  },
  modalButtonText: {
    color: Colors.darkMedGray,
  },
  cancelButton: {
    borderBottomWidth: 0,
  },
  cancelButtonText: {
    color: Colors.darkMedGray,
  },
});
