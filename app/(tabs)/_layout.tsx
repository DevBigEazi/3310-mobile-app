import { Redirect, Tabs } from "expo-router";
import React from "react";
import { StatusBar, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Octicons from "@expo/vector-icons/Octicons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

// Types
type TabConfig = {
  name: "game" | "ranks" | "pay" | "profile";
  title: string;
  icon: (color: string) => React.ReactNode;
};

// Constants
const COLORS = {
  active: "#00FFFF",
  inactive: "#FFF",
  background: "#808080",
} as const;

const TAB_BAR_HEIGHT = Platform.select({ ios: 70, default: 80 });

// Tab Configuration
const TABS: TabConfig[] = [
  {
    name: "game",
    title: "PLAY",
    icon: (color) => (
      <Ionicons name="game-controller-outline" size={24} color={color} />
    ),
  },
  {
    name: "ranks",
    title: "RANKS",
    icon: (color) => <Octicons name="trophy" size={24} color={color} />,
  },
  {
    name: "pay",
    title: "PAY",
    icon: (color) => <AntDesign name="credit-card" size={24} color={color} />,
  },
  {
    name: "profile",
    title: "PROFILE",
    icon: (color) => <MaterialIcons name="person" size={24} color={color} />,
  },
];

export default function TabLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.active,
          tabBarInactiveTintColor: COLORS.inactive,
          tabBarStyle: {
            backgroundColor: COLORS.background,
            height: TAB_BAR_HEIGHT,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            fontFamily: "PixelifySans-Regular",
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
        }}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color }) => tab.icon(color),
            }}
          />
        ))}
      </Tabs>
    </SafeAreaView>
  );
}
