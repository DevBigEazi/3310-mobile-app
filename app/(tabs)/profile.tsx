import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../../client';

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const client = useReactiveClient(dynamicClient);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

  // TODO: Enable when native build + domain setup is complete
  // Passkey registration requires: 
  //   1. react-native-passkey native module (needs dev build, not Expo Go)
  //   2. .well-known files hosted on auth.play3310.xyz
  const PASSKEY_ENABLED = false;

  const handleRegisterPasskey = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!PASSKEY_ENABLED) {
      Alert.alert('COMING SOON', 'Biometric passkey login will be available in the next update.');
      return;
    }
    setIsRegisteringPasskey(true);
    try {
      await client.passkeys.register();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('LINK COMPLETED', 'Biometric passkey has been successfully registered to this agent account.');
    } catch (error: any) {
      console.error('Passkey registration failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('LINK FAILURE', error.message || 'Failed to establish biometric key.');
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Clear Dynamic session
      await client.auth.logout();
      // Clear local storage
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('registered_username');
      await AsyncStorage.removeItem('registered_avatar_color');
      await AsyncStorage.removeItem('registered_avatar_name');
      
      // Redirect to sign in
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0E27', justifyContent: 'center', alignItems: 'center' }}>
      <Text className="font-arcade text-secondary text-sm mb-8">PROFILE</Text>
      
      <TouchableOpacity
        onPress={handleRegisterPasskey}
        disabled={isRegisteringPasskey}
        activeOpacity={0.8}
        className="px-8 py-4 bg-accent/10 border-2 border-accent rounded-xl mb-6 flex-row items-center justify-center gap-3 w-64"
        style={{
          shadowColor: '#00FF00',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 5
        }}
      >
        {isRegisteringPasskey ? (
          <ActivityIndicator size="small" color="#00FF00" />
        ) : (
          <Text className="font-pixel_bold text-accent text-sm tracking-widest text-center">
            ESTABLISH BIOMETRIC KEY
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        disabled={isRegisteringPasskey}
        activeOpacity={0.8}
        className="px-8 py-4 bg-destructive/10 border-2 border-red-500 rounded-xl w-64 items-center justify-center"
        style={{
          shadowColor: '#FF0000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 5
        }}
      >
        <Text className="font-pixel_bold text-white text-sm tracking-widest">
          LOGOUT
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
