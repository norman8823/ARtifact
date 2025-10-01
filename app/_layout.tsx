import "react-native-gesture-handler";
import "react-native-get-random-values";

import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import "react-native-reanimated";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { configureAmplify } from "@/src/aws/config";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { FavoritesProvider } from "@/src/contexts/FavoritesContext";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://5fca006e6a6f674b48838b231140d026@o4509787380842496.ingest.us.sentry.io/4509787382284288",

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

  // State to track if Amplify is configured
  const [isAmplifyConfigured, setIsAmplifyConfigured] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Configure Amplify on component mount
  useEffect(() => {
    const initializeAmplify = async () => {
      try {
        await configureAmplify();
        setIsAmplifyConfigured(true);
      } catch (error) {
        console.error("Failed to configure Amplify:", error);
        setConfigError(
          error instanceof Error ? error.message : "Unknown configuration error"
        );

        // Log to Sentry
        Sentry.captureException(error, {
          tags: {
            component: "RootLayout",
            action: "amplify_configuration",
          },
        });
      }
    };

    initializeAmplify();
  }, []);

  // Show loading screen while fonts are loading
  if (!loaded) {
    return null;
  }

  // Show loading screen while Amplify is configuring
  if (!isAmplifyConfigured) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.lightGray,
        }}
      >
        {configError ? (
          <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
            <Text
              style={{
                color: Colors.darkGray,
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Configuration Error
            </Text>
            <Text
              style={{
                color: Colors.darkMedGray,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {configError}
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <ActivityIndicator size="large" color={Colors.darkGray} />
            <Text
              style={{
                color: Colors.darkGray,
                fontSize: 16,
                marginTop: 16,
              }}
            >
              Initializing...
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
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
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
});
