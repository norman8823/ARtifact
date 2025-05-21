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
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Profile Settings</ThemedText>
      </ThemedView>

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
              <Pressable style={styles.editAvatarButton}>
                <FontAwesome name="pencil" size={12} color="#fff" />
              </Pressable>
            </Pressable>
          </View>
          <ThemedText style={styles.editPhotoText}>
            Edit profile photo
          </ThemedText>
        </ThemedView>

        {/* Form Fields */}
        <ThemedView style={styles.formField}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <ThemedView style={styles.inputContainer}>
            <FontAwesome
              name="user-o"
              size={16}
              color="#666"
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
              color="#666"
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
              color="#666"
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
              color="#666"
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
                color="#666"
              />
            </Pressable>
          </ThemedView>
        </ThemedView>

        {/* Buttons */}
        <Pressable style={styles.saveButton}>
          <FontAwesome
            name="check"
            size={16}
            color="#fff"
            style={styles.buttonIcon}
          />
          <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
        </Pressable>

        <Pressable style={styles.deleteButton}>
          <FontAwesome
            name="trash"
            size={16}
            color="#666"
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
                name="image-o"
                size={20}
                color="#333"
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
                color="#333"
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
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
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
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  editPhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  formField: {
    marginBottom: 24,
  },
  lastFormField: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingVertical: 16,
  },
  deleteButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
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
    borderBottomColor: "#e0e0e0",
  },
  modalIcon: {
    marginRight: 12,
  },
  modalButtonText: {
    fontSize: 16,
    color: "#333",
  },
  cancelButton: {
    borderBottomWidth: 0,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
});
