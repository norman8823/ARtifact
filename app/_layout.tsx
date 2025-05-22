import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        <Stack.Screen
          name="profileSettings"
          options={{
            headerTitle: "Settings",
            headerBackTitle: "Profile",
          }}
        />
        <Stack.Screen
          name="artworksVisited"
          options={{
            headerTitle: "Artworks Visited",
            headerBackTitle: "Profile",
          }}
        />
        <Stack.Screen
          name="favorites"
          options={{
            headerTitle: "Favorites",
            headerBackTitle: "Profile",
          }}
        />
        <Stack.Screen
          name="questsCompleted"
          options={{
            headerTitle: "Quests Completed",
            headerBackTitle: "Profile",
          }}
        />
        <Stack.Screen
          name="collection"
          options={{
            headerTitle: "Collection",
            headerBackTitle: "Home",
          }}
        />
        <Stack.Screen
          name="artDetail"
          options={({ route }) => {
            const params = route.params as { from?: string; id?: string };
            return {
              headerTitle: "Art Detail",
              headerBackTitle:
                params?.from === "questDetail"
                  ? "Quest Detail"
                  : params?.from === "collection"
                  ? "Collection"
                  : "Home",
            };
          }}
        />
        <Stack.Screen
          name="questDetail"
          options={{
            headerTitle: "Quest Detail",
            headerBackTitle: "ArtQuest",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
