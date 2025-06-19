import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.metRed,
        tabBarInactiveTintColor: Colors.lightGray,
        headerStyle: { backgroundColor: Colors.lightGray },
        headerShown: true,
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
          headerTitle: "",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          headerTitle: "",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="compass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          headerTitle: "",
          tabBarIcon: ({ color }) => <TabBarIcon name="camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="artQuest"
        options={{
          title: "ArtQuest",
          headerTitle: "",
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}
