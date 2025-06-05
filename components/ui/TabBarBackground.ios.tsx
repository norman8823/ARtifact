import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { StyleSheet, View } from "react-native";

export default function TabBarBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#b60021" }]} />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
