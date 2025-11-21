import { Stack } from "expo-router";
import React from "react";
import { Platform, StatusBar } from "react-native";

export default function AuthLayout() {
  return (
    <Stack>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "light-content" : "default"}
      />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
    </Stack>
  );
}
