import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { Alert, Linking, Pressable } from "react-native";

const PRIVACY_POLICY_URL = "https://artifactar.com/privacy/";

export function PrivacyPolicyLink() {
  const openPolicy = async () => {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert("Couldn't open privacy policy", `Please visit ${PRIVACY_POLICY_URL}`);
    }
  };

  return (
    <Pressable
      accessibilityRole="link"
      onPress={openPolicy}
      style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}
    >
      <ThemedText style={{ color: Colors.darkMedGray, textDecorationLine: "underline" }}>
        Privacy Policy
      </ThemedText>
    </Pressable>
  );
}
