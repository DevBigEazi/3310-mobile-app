import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../../client';
import { BACKEND_URL, AVATARS } from '../../constants/config';
import RetroCrtEffects from '../../components/auth/RetroCrtEffects';

interface PlayerProfile {
  address: string;
  username: string;
  email?: string;
  referralCode: string;
  referredBy: string | null;
  referralPoints: number;
  referralCount: number;
}

interface PlayerStats {
  highestScore: number;
  totalGames: number;
}

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const client = useReactiveClient(dynamicClient);
  
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedAvatarName, setSelectedAvatarName] = useState<string>('CYAN VIPER');

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const storedName = await AsyncStorage.getItem('registered_avatar_name');
        if (storedName) {
          setSelectedAvatarName(storedName);
        }
      } catch (e) {
        console.error('Failed to load avatar from storage:', e);
      }
    };
    loadAvatar();
  }, []);

  const activeAvatar = AVATARS.find(a => a.name === selectedAvatarName) || AVATARS[0];

  const handleChangeAvatar = async (avatarItem: typeof AVATARS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAvatarName(avatarItem.name);
    try {
      await AsyncStorage.setItem('registered_avatar_name', avatarItem.name);
      await AsyncStorage.setItem('registered_avatar_color', avatarItem.color);
    } catch (e) {
      console.error('Failed to save avatar choice:', e);
    }
  };

  const PASSKEY_ENABLED = false;

  // Retrieve player profile from backend
  const fetchProfile = useCallback(async () => {
    const address = client.wallets.primary?.address;
    if (!address) {
      setIsLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwt_token');
      const response = await fetch(`${BACKEND_URL}/api/player/${address}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.player);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching player profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [client.wallets.primary?.address]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleCopyReferral = () => {
    if (!profile?.referralCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const refLink = `https://play3310.xyz/ref/${profile.referralCode}`;
    Clipboard.setString(refLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
      Alert.alert('LINK COMPLETED', 'Biometric passkey has been successfully registered.');
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
      await client.auth.logout();
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('registered_username');
      await AsyncStorage.removeItem('registered_avatar_color');
      await AsyncStorage.removeItem('registered_avatar_name');
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text className="font-terminal text-sm text-secondary mt-3">DECRYPTING PROFILE...</Text>
      </SafeAreaView>
    );
  }

  const referralLink = profile ? `https://play3310.xyz/ref/${profile.referralCode}` : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0E27' }}>
      <View className="flex-1 w-full px-4 pt-2 items-center justify-start gap-4">
        {/* Top Area: Branding & Title */}
        <View className="items-center w-full">
          {/* Console Branding */}
          <View className="items-center mb-0.5 mt-1">
            <Text className="font-arcade text-[10px] text-secondary tracking-[2px] opacity-80">
              // 3310 CONSOLE //
            </Text>
            <Text className="font-pixel text-[11px] text-grey-100 mt-0.5">
              SECURE DECRYPTED USER PROFILE
            </Text>
          </View>
          
          <Text className="font-terminal text-grey-100 text-[14px] text-center mb-1">
            AGENT: {profile?.username || 'UNKNOWN'} ACTIVE
          </Text>
        </View>

        {/* Middle Area: Profile Card (styled like game screen canvas) */}
        <View 
          className="w-full max-w-sm bg-[#0D122B] border-2 rounded-2xl p-4 relative my-3 overflow-hidden"
          style={{
            borderColor: activeAvatar.color,
            shadowColor: activeAvatar.color,
            shadowOpacity: 0.4,
            shadowRadius: 10,
          }}
        >
          {/* CRT scan overlay */}
          <RetroCrtEffects />

          {/* Profile Card Header */}
          <View className="items-center border-b border-grey-200/20 pb-2.5 w-full">
            <View 
              className="w-14 h-14 rounded-full bg-secondary/15 border-2 justify-center items-center mb-1.5"
              style={{
                borderColor: activeAvatar.color,
                shadowColor: activeAvatar.color,
                shadowOpacity: 0.8,
                shadowRadius: 6,
              }}
            >
              <Ionicons name="person" size={28} color={activeAvatar.color} />
            </View>
            <Text className="font-pixel_bold text-base text-secondary">{profile?.username || 'UNKNOWN_AGENT'}</Text>
            <Text className="font-terminal text-[10px] text-grey-100 mt-0.5 tracking-wider">STATUS: ACCESS VERIFIED</Text>
          </View>

          {/* Stats Grid */}
          <View className="flex-row justify-between w-full my-2">
            <View className="w-[48%] bg-grey-200/10 border border-grey-200/20 rounded-xl p-2 items-center">
              <Text className="font-pixel text-[8px] text-grey-100 mb-0.5">ALL-TIME HIGH</Text>
              <Text className="font-arcade text-base text-accent">{stats?.highestScore || 0}</Text>
            </View>
            <View className="w-[48%] bg-grey-200/10 border border-grey-200/20 rounded-xl p-2 items-center">
              <Text className="font-pixel text-[8px] text-grey-100 mb-0.5">GAMES PLAYED</Text>
              <Text className="font-arcade text-base text-accent">{stats?.totalGames || 0}</Text>
            </View>
          </View>

          {/* Avatar Selection Grid */}
          <View className="w-full border-t border-grey-200/20 pt-2.5">
            <Text className="font-terminal text-[10px] text-secondary mb-2 tracking-wider uppercase text-center">
              Configure Snake Sub-System (Avatar):
            </Text>
            
            {/* Selection Grid */}
            <View className="flex-row gap-3 justify-center mb-2">
              {AVATARS.map((item, idx) => {
                const isSelected = selectedAvatarName === item.name;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleChangeAvatar(item)}
                    activeOpacity={0.8}
                    className="w-10 h-10 p-4 rounded-lg justify-center items-center border-2"
                    style={{
                      borderColor: isSelected ? item.color : '#2d3356',
                      backgroundColor: isSelected ? `${item.color}20` : '#07091a',
                      shadowColor: item.color,
                      shadowOpacity: isSelected ? 0.7 : 0,
                      shadowRadius: 5,
                    }}
                  >
                    <View 
                      className="w-5 h-5 p-2"
                      style={{
                        backgroundColor: item.color,
                        shadowColor: item.color,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.9,
                        shadowRadius: 4,
                      }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Active specs screen */}
            <View className="bg-[#07091a] rounded-lg p-2 border border-[#2d3356]">
              <Text 
                className="font-arcade text-[8px] mb-1.5 tracking-wider"
                style={{ color: activeAvatar.color }}
              >
                SYS ACTIVE: {activeAvatar.name}
              </Text>
              
              {/* Stat Row 1: SPEED */}
              <View className="mb-1">
                <View className="flex-row justify-between mb-0.5">
                  <Text className="font-pixel text-[7px] text-grey-100">SPEED ENGINE</Text>
                  <Text className="font-terminal text-[9px] text-white">{activeAvatar.speed}%</Text>
                </View>
                <View className="h-[3px] bg-grey-200 rounded overflow-hidden">
                  <View className="h-full bg-secondary" style={{ width: `${activeAvatar.speed}%` }} />
                </View>
              </View>

              {/* Stat Row 2: TAIL CAPACITY */}
              <View className="mb-1">
                <View className="flex-row justify-between mb-0.5">
                  <Text className="font-pixel text-[7px] text-grey-100">SIZE POTENTIAL</Text>
                  <Text className="font-terminal text-[9px] text-white">{activeAvatar.size}%</Text>
                </View>
                <View className="h-[3px] bg-grey-200 rounded overflow-hidden">
                  <View className="h-full bg-accent" style={{ width: `${activeAvatar.size}%` }} />
                </View>
              </View>

              {/* Stat Row 3: GLOW RESONANCE */}
              <View>
                <View className="flex-row justify-between mb-0.5">
                  <Text className="font-pixel text-[7px] text-grey-100">GLOW RESONANCE</Text>
                  <Text className="font-terminal text-[9px] text-white">{activeAvatar.glow}%</Text>
                </View>
                <View className="h-[3px] bg-grey-200 rounded overflow-hidden">
                  <View className="h-full bg-reward" style={{ width: `${activeAvatar.glow}%` }} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Area: Referrals and Security */}
        <View className="w-full max-w-sm mt-1 items-center">
          {/* Referral Copy Row */}
          <View className="w-full mb-2">
            <View className="flex-row justify-between items-center mb-1 px-1">
              <Text className="font-pixel_bold text-[9px] text-secondary uppercase">Referral Link</Text>
              <View className="bg-accent/20 px-2 py-0.5 rounded">
                <Text className="font-terminal text-[9px] text-accent">+{profile?.referralPoints || 0} pts</Text>
              </View>
            </View>
            <View 
              className="flex-row items-center bg-[#0D122B] border rounded-xl p-1.5"
              style={{ borderColor: `${activeAvatar.color}30` }}
            >
              <Text 
                className="flex-1 font-terminal text-xs ml-1 mr-2" 
                numberOfLines={1}
                style={{ color: activeAvatar.color }}
              >
                {referralLink}
              </Text>
              <TouchableOpacity
                onPress={handleCopyReferral}
                className="px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: activeAvatar.color }}
                activeOpacity={0.7}
              >
                <Text 
                  className="font-pixel_bold text-[9px]"
                  style={{ color: '#0A0E27' }}
                >
                  {copiedLink ? 'COPIED!' : 'COPY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action buttons (Logout & Passkey) */}
          <View className="w-full flex-row gap-2 mb-2">
            <TouchableOpacity
              onPress={handleRegisterPasskey}
              disabled={isRegisteringPasskey}
              activeOpacity={0.8}
              className="flex-1 py-2.5 bg-accent/5 border border-accent rounded-xl flex-row items-center justify-center gap-1.5"
            >
              {isRegisteringPasskey ? (
                <ActivityIndicator size="small" color="#00FF00" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={12} color="#00FF00" />
                  <Text className="font-pixel_bold text-accent text-[9px] tracking-wider">
                    BIOMETRIC KEY
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              className="flex-1 py-2.5 bg-destructive/5 border border-red-500 rounded-xl flex-row items-center justify-center gap-1.5"
            >
              <Ionicons name="log-out-outline" size={12} color="white" />
              <Text className="font-pixel_bold text-white text-[9px] tracking-wider">
                LOGOUT TERMINAL
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
