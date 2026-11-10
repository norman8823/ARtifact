import { useBottomTabBarHeight } from "expo-router/tabs";
import { StyleSheet, View } from "react-native";
import { Colors } from "@/constants/Colors";

export default function TabBarBackground() {
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: Colors.darkGray }]}
    />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
