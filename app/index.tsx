import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '@/components/Onboarding';
import { dynamicClient } from '../client';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { BACKEND_URL } from '../constants/config';

export default function Index() {
  const router = useRouter();
  const client = useReactiveClient(dynamicClient);
  const [isChecking, setIsChecking] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    checkAppStatus();
  }, [client.auth.authenticatedUser, client.wallets.primary]);

  const checkAppStatus = async () => {
    try {
      setIsChecking(true);
      
      const onboarded = await AsyncStorage.getItem('onboarding_completed');

      if (onboarded === 'true') {
        setShowOnboarding(false);
        
        // Check if authenticated on Dynamic
        if (client.auth.authenticatedUser) {
          const address = client.wallets.primary?.address;
          if (address) {
            try {
              console.log("[DEBUG index.tsx] checkAppStatus hitting BACKEND_URL:", BACKEND_URL, "for address:", address);
              // Check if address is registered in the backend
              const checkResponse = await fetch(`${BACKEND_URL}/api/player/check/${address}`);
              const checkData = await checkResponse.json();
              
              if (checkData.exists) {
                // Complete registration/login to get token
                const loginResponse = await fetch(`${BACKEND_URL}/api/player`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ address, username: 'returning-user' }),
                });
                const loginData = await loginResponse.json();
                
                if (loginData.token) {
                  await AsyncStorage.setItem('jwt_token', loginData.token);
                  await AsyncStorage.setItem('registered_username', loginData.player.username);
                  router.replace('/(tabs)/game');
                  return;
                }
              } else {
                // Authenticated but does not exist in backend (needs registration)
                router.replace('/(auth)/sign-in');
                return;
              }
            } catch (err) {
              console.error('Error auto-logging in player:', err);
            }
          } else {
            // Authenticated on Dynamic, but primary wallet address is not ready yet.
            // Stay in checking/loading state and wait for the wallet address update.
            return;
          }
        } else {
          router.replace('/(auth)/sign-in');
        }
      } else {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error reading AsyncStorage status:', error);
      setShowOnboarding(true);
    } finally {
      // Only complete loading check if we are NOT waiting for the wallet address
      if (!(client.auth.authenticatedUser && !client.wallets.primary?.address)) {
        setIsChecking(false);
      }
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setShowOnboarding(false);
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      router.replace('/(auth)/sign-in');
    }
  };

  if (isChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E27', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00FFFF" />
      </View>
    );
  }

  return showOnboarding ? (
    <Onboarding onComplete={handleOnboardingComplete} />
  ) : null;
}
