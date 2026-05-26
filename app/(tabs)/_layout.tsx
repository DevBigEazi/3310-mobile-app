import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00FFFF', // Neon Cyan
        tabBarInactiveTintColor: '#808080', // Muted Grey
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0E27', // Deep space black/blue
          borderTopWidth: 2,
          borderTopColor: '#404040', // Dark Charcoal border
          height: Platform.OS === 'ios' ? 90 : 80,
          paddingBottom: Platform.OS === 'ios' ? 30 : 15,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontFamily: 'PixelifySans-Bold',
          fontSize: 11,
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="game"
        options={{
          title: 'PLAY',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "game-controller" : "game-controller-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranks"
        options={{
          title: 'RANKS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "trophy" : "trophy-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: 'PAY',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "card" : "card-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
      {/* Hide default boilerplate routes */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
