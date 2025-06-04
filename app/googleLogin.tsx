import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";

export default function GoogleLoginScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={20} color="#333" />
          </Pressable>
          <ThemedView style={styles.logoCircle}>
            <FontAwesome name="building" size={24} color="#333" />
          </ThemedView>
          <ThemedView style={styles.placeholder} />
        </ThemedView>
        <ThemedText style={styles.title}>Sign in with Google</ThemedText>
        <ThemedText style={styles.subtitle}>
          Choose an account to continue
        </ThemedText>
      </ThemedView>

      {/* Main Content */}
      <ThemedView style={styles.mainContent}>
        {/* Google Accounts Section */}
        <ThemedView style={styles.accountsSection}>
          <ThemedView style={styles.googleHeader}>
            <FontAwesome
              name="google"
              size={20}
              color="#666"
              style={styles.googleIcon}
            />
            <ThemedText style={styles.googleHeaderText}>
              Select a Google Account
            </ThemedText>
          </ThemedView>

          {/* Accounts List */}
          <ThemedView style={styles.accountsList}>
            {/* Selected Account */}
            <ThemedView style={styles.accountItemSelected}>
              <Image
                source={{
                  uri: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
                }}
                style={styles.avatar}
              />
              <ThemedView style={styles.accountInfo}>
                <ThemedText
                  style={[styles.accountName, styles.selectedAccountInfo]}
                >
                  Sophia Anderson
                </ThemedText>
                <ThemedText
                  style={[styles.accountEmail, styles.selectedAccountInfo]}
                >
                  sophia.anderson@gmail.com
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.checkmark}>
                <FontAwesome name="check" size={16} color="#FFFFFF" />
              </ThemedView>
            </ThemedView>

            {/* Other Accounts */}
            <ThemedView style={styles.accountItem}>
              <Image
                source={{
                  uri: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
                }}
                style={styles.avatar}
              />
              <ThemedView style={styles.accountInfo}>
                <ThemedText style={styles.accountName}>James Wilson</ThemedText>
                <ThemedText style={styles.accountEmail}>
                  james.wilson@gmail.com
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.accountItem}>
              <Image
                source={{
                  uri: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg",
                }}
                style={styles.avatar}
              />
              <ThemedView style={styles.accountInfo}>
                <ThemedText style={styles.accountName}>Emma Roberts</ThemedText>
                <ThemedText style={styles.accountEmail}>
                  emma.roberts@gmail.com
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Add Account */}
            <ThemedView style={styles.addAccount}>
              <ThemedView style={styles.addAccountIcon}>
                <FontAwesome name="plus" size={16} color="#666" />
              </ThemedView>
              <ThemedText style={styles.addAccountText}>
                Use another account
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Information Box */}
        <ThemedView style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            By continuing, you'll allow ARtifact to access your Google account
            information in accordance with our privacy policy.
          </ThemedText>
        </ThemedView>

        {/* Action Buttons */}
        <ThemedView style={styles.actionButtons}>
          <Pressable
            style={styles.continueButton}
            onPress={() => router.replace("/home")}
          >
            <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>

      {/* Footer */}
      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Having trouble?{" "}
          <ThemedText style={styles.helpText}>Get help</ThemedText>
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "Playfair Display",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  accountsSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
    marginBottom: 32,
  },
  googleHeader: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  googleIcon: {
    marginRight: 12,
  },
  googleHeaderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  accountsList: {
    backgroundColor: "#FFFFFF",
  },
  accountItemSelected: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  selectedAccountInfo: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  accountName: {
    fontSize: 16,
    fontWeight: "500",
  },
  accountEmail: {
    fontSize: 14,
    color: "#666",
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  addAccount: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  addAccountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addAccountText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  infoBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  actionButtons: {
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
  },
  helpText: {
    color: "#007AFF",
    fontWeight: "500",
  },
});
