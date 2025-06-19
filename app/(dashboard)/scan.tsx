import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet, SafeAreaView } from "react-native";
import { Stack } from "expo-router";

export default function ScanScreen() {
  return (
    <>
      <Stack.Screen />
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={styles.container}>
          <ThemedText style={styles.title}>Scan</ThemedText>
        </ThemedView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    paddingTop: 16,
  },
});
