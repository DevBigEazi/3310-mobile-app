import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  // In Phase 1 (Free Play), we redirect directly to the main gameplay tab.
  // When Auth/onboarding is fully wired up, we will check JWT persistence and redirect to /(auth)/sign-in if unauthorized.
  return <Redirect href="/(tabs)/game" />;
}
