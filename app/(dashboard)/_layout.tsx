import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useState } from "react";
import { Platform } from "react-native";

import { AuthPromptModal, type AuthPromptContext } from "@/components/AuthPromptModal";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthContext } from "@/src/contexts/AuthContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuthContext();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalContext, setAuthModalContext] = useState<AuthPromptContext>("quest");

  const handleProtectedTabPress = (context: AuthPromptContext) => {
    if (!isAuthenticated) {
      setAuthModalContext(context);
      setAuthModalVisible(true);
      return true; // Prevent default navigation
    }
    return false;
  };

  return (
    <>
    <AuthPromptModal
      visible={authModalVisible}
      onClose={() => setAuthModalVisible(false)}
      context={authModalContext}
    />
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.metRed,
        tabBarInactiveTintColor: Colors.lightGray,
        headerStyle: { backgroundColor: Colors.lightGray },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="compass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="artQuest"
        options={{
          title: "ArtQuest",
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (handleProtectedTabPress("quest")) {
              e.preventDefault();
            }
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (handleProtectedTabPress("profile")) {
              e.preventDefault();
            }
          },
        }}
      />
    </Tabs>
    </>

  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}
