import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { FavoritesProvider } from "@/src/contexts/FavoritesContext";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://5fca006e6a6f674b48838b231140d026@o4509787380842496.ingest.us.sentry.io/4509787382284288',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    TiltPrism: require("../assets/fonts/TiltPrism-Regular-VariableFont_XROT,YROT.ttf"),
    OldStandardTTBold: require("../assets/fonts/OldStandardTT-Bold.ttf"),
    OldStandardTTRegular: require("../assets/fonts/OldStandardTT-Regular.ttf"),
    LatoRegular: require("../assets/fonts/Lato-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <FavoritesProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.lightGray,
            },
            headerTintColor: Colors.darkGray,
            headerBackButtonDisplayMode: "minimal",
            headerBackButtonMenuEnabled: false,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="googleLogin" options={{ headerShown: false }} />
          <Stack.Screen name="appleLogin" options={{ headerShown: false }} />
          <Stack.Screen name="phoneLogin" options={{ headerShown: false }} />
          <Stack.Screen name="emailLogin" options={{ headerShown: false }} />
          <Stack.Screen
            name="(dashboard)"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="profileSettings"
            options={{
              headerTitle: "Profile Settings",
            }}
          />
          <Stack.Screen
            name="artworksVisited"
            options={{
              headerTitle: "Artworks Visited",
            }}
          />
          <Stack.Screen
            name="favorites"
            options={{
              headerTitle: "Favorites",
            }}
          />
          <Stack.Screen
            name="questsCompleted"
            options={{
              headerTitle: "Quests Completed",
            }}
          />
          <Stack.Screen
            name="collection"
            options={{
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="artDetail"
            options={{
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="questDetail"
            options={{
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="arViewer"
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />
        </Stack>
      </FavoritesProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
});