import "react-native-gesture-handler";
import "react-native-get-random-values";

import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import "react-native-reanimated";

import { HeaderBackButton } from "@/components/HeaderBackButton";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { configureAmplify } from "@/src/aws/config";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { EntitlementProvider } from "@/src/contexts/EntitlementContext";
import { FavoritesProvider } from "@/src/contexts/FavoritesContext";
import { QueryProvider } from "@/src/providers/QueryProvider";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://5fca006e6a6f674b48838b231140d026@o4509787380842496.ingest.us.sentry.io/4509787382284288",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Session Replay is deliberately OFF. It previously recorded 10% of all
  // sessions and 100% of error sessions (mobileReplayIntegration), i.e. real
  // users' screens, which is a disclosure burden we chose not to carry for a
  // paid, signed-in app. Crash and error reporting are unaffected. If it is
  // ever re-enabled it MUST be disclosed in the privacy policy and the App
  // Privacy label first (backlog 0.6).

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
      <QueryProvider>
        <AuthProvider>
          <EntitlementProvider>
            <FavoritesProvider>
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: Colors.lightGray,
                  },
                  headerTintColor: Colors.darkGray,
                  headerBackButtonDisplayMode: "minimal",
                  headerBackButtonMenuEnabled: false,
                  // Our own back control instead of UIKit's. **Confirmed by the
                  // reporter on iOS 27 beta (2026-08-07): the system button did
                  // not pop, this one does.** UIKit draws and highlights its own
                  // button, so the failure looked like a live control; the action
                  // never reached the navigator and JS cannot intervene there.
                  //
                  // iOS 26+ wraps navigation-bar items in a Liquid Glass circle
                  // with no opt-out, so `HeaderBackButton` is deliberately square
                  // and centred — see its comments. Don't give it asymmetric
                  // padding; the container wraps whatever box we hand it and the
                  // arrow ends up visibly off-centre (shipped that way in 1.0.53).
                  headerBackVisible: false,
                  headerLeft: () => <HeaderBackButton />,
                  gestureEnabled: true,
                  // Swipe back from anywhere on the screen, not just the left
                  // edge. The header back button is a small target — with
                  // `headerBackButtonDisplayMode: "minimal"` it is a bare
                  // chevron — so this is the second way out of a screen when
                  // that tap does not land. Screens where a full-surface drag
                  // means something else (arViewer, scan) opt out below.
                  fullScreenGestureEnabled: true,
                  animation: "slide_from_right",
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
                <Stack.Screen name="emailLogin" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(dashboard)"
                  options={{
                    headerShown: false,
                    gestureEnabled: false,
                    // Freeze the dashboard subtree while it's blurred (a detail
                    // screen is pushed over it). On a cold launch, Home's first
                    // query revalidations + cache-restore flip would otherwise
                    // re-render the blurred screen mid-push-transition, desyncing
                    // react-native-screens and dropping the first back press.
                    // Freezing holds those updates until Home regains focus, so
                    // the first back-navigation works. Cold-launch paint is
                    // unaffected — Home is focused, never frozen, while painting.
                    freezeOnBlur: true,
                  }}
                />
                <Stack.Screen
                  name="profileSettings"
                  options={{
                    headerTitle: "Profile Settings",
                    gestureEnabled: true,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="artworksVisited"
                  options={{
                    headerTitle: "Artworks Visited",
                    gestureEnabled: true,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="favorites"
                  options={{
                    headerTitle: "Favorites",
                    gestureEnabled: true,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="questsCompleted"
                  options={{
                    headerTitle: "Quests Completed",
                    gestureEnabled: true,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="collection"
                  options={{
                    headerTitle: "",
                    gestureEnabled: true,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="artDetail"
                  options={{
                    headerTitle: "",
                    gestureEnabled: true,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="questDetail"
                  options={{
                    headerTitle: "",
                    gestureEnabled: true,
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="arViewer"
                  options={{
                    headerShown: false,
                    gestureEnabled: true,
                    // Edge-swipe only. A full-screen back gesture would swallow
                    // the drag/pinch that positions the AR model — the same
                    // gestures the tap overlay is unmounted to let through
                    // (see landmine #1). arViewer keeps its own back button.
                    fullScreenGestureEnabled: false,
                  }}
                />
              </Stack>
            </FavoritesProvider>
          </EntitlementProvider>
        </AuthProvider>
      </QueryProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
});
