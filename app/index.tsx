import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Onboarding from "@/components/Onboarding";
import { useActiveAccount } from 'thirdweb/react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/config/api';

const WALLET_CREATED_KEY = 'wallet_created';

export default function Index() {
  const activeAccount = useActiveAccount();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, [activeAccount]);

  const getWalletCreatedStatus = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const status = await AsyncStorage.getItem(WALLET_CREATED_KEY);
      return status === 'true';
    } catch (error) {
      console.error('Error reading wallet status:', error);
      return false;
    }
  };

  const setWalletCreatedStatus = async (value: boolean) => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(WALLET_CREATED_KEY, value.toString());
    } catch (error) {
      console.error('Error saving wallet status:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      setIsChecking(true);

      // Check if user has previously created a wallet (persisted in device storage)
      const walletCreatedBefore = await getWalletCreatedStatus();

      // If user previously connected, don't show onboarding
      if (walletCreatedBefore) {
        setShouldShowOnboarding(false);
        
        // If wallet is currently active, route based on username status
        if (activeAccount) {
          await routeUserBasedOnUsername(activeAccount.address);
        } else {
          // Previous wallet but no active account - show sign-in to reconnect
          router.replace('/(auth)/sign-in');
        }
        return;
      }

      // If no prior wallet but user is now connected, mark wallet as created
      if (activeAccount) {
        await setWalletCreatedStatus(true);
        setShouldShowOnboarding(false);
        // Let sign-in flow handle routing
        router.replace('/(auth)/sign-in');
        return;
      }

      // No prior wallet and no active account = show onboarding
      setShouldShowOnboarding(true);
    } catch (error) {
      console.error('Auth check error:', error);
      setShouldShowOnboarding(true);
    } finally {
      setIsChecking(false);
    }
  };

  const routeUserBasedOnUsername = async (address: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/${address}`);
      
      if (response.ok) {
        const player = await response.json();
        if (player.username) {
          // Has username, go to game
          router.replace('/(tabs)/game');
        } else {
          // No username, show username modal
          router.replace('/(auth)/sign-in');
        }
      } else {
        // Player not found, go to sign-in to create
        router.replace('/(auth)/sign-in');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      router.replace('/(auth)/sign-in');
    }
  };

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return shouldShowOnboarding ? <Onboarding /> : null;
}