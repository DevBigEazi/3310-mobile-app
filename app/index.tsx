import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '@/components/Onboarding';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    checkAppStatus();
  }, []);

  const checkAppStatus = async () => {
    try {
      setIsChecking(true);
      
      const onboarded = await AsyncStorage.getItem('onboarding_completed');
      const username = await AsyncStorage.getItem('registered_username');

      if (onboarded === 'true') {
        setShowOnboarding(false);
        if (username) {
          router.replace('/(tabs)/game');
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
      setIsChecking(false);
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
