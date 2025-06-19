import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { StyleSheet, View } from "react-native";
import { Colors } from "../../constants/Colors";

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
