import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const username = 'alice_snake';
  const address = '0xalicesmartaccountaddress0000000000001';
  const referralCode = 'X4RIOW';
  const referralPoints = 50;
  const referralCount = 1;
  const gamesPlayed = 5;

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView className="flex-1 px-6 pt-6">
        
        {/* Title */}
        <Text className="font-arcade text-warning text-xl text-center mb-8">USER PROFILE</Text>

        {/* Profile Card */}
        <View className="bg-grey-200 border-2 border-grey rounded-xl p-5 mb-6 items-center">
          <View className="bg-secondary/20 p-4 rounded-full mb-3 border border-secondary">
            <Ionicons name="person" size={48} color="#00FFFF" />
          </View>
          <Text className="font-pixel_bold text-secondary text-lg">@{username}</Text>
          <Text className="font-terminal text-grey-100 text-xs mt-1 text-center" numberOfLines={1}>
            {address}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-grey-200 border border-grey/60 rounded-xl p-4 w-[48%] items-center">
            <Text className="font-pixel text-grey-100 text-xs">GAMES PLAYED</Text>
            <Text className="font-terminal text-accent text-3xl mt-1">{gamesPlayed}</Text>
          </View>
          <View className="bg-grey-200 border border-grey/60 rounded-xl p-4 w-[48%] items-center">
            <Text className="font-pixel text-grey-100 text-xs">REFERRAL PTS</Text>
            <Text className="font-terminal text-accent text-3xl mt-1">{referralPoints}</Text>
          </View>
        </View>

        {/* Referral Program Card */}
        <View className="bg-grey-200 border border-grey/60 rounded-xl p-5 mb-8">
          <Text className="font-pixel_bold text-white text-base mb-2">INVITE PLAYERS</Text>
          <Text className="font-poppins text-grey-100 text-xs leading-relaxed mb-4">
            Share your unique code. Get 50 referral points on signup. Your referred friends get 25 points.
          </Text>
          
          <View className="flex-row border border-grey rounded-lg overflow-hidden bg-primary items-center px-4 py-3">
            <Text className="font-terminal text-warning text-lg flex-1">CODE: {referralCode}</Text>
            <TouchableOpacity className="bg-secondary px-3 py-1.5 rounded border border-white/20 active:opacity-80">
              <Text className="font-pixel_bold text-primary text-xs">COPY</Text>
            </TouchableOpacity>
          </View>
          
          <Text className="font-pixel text-grey-100 text-xs mt-3">
            Successful Referrals: {referralCount}
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity className="w-full bg-destructive border-2 border-white py-4 rounded-xl items-center active:opacity-80 mb-12">
          <Text className="font-pixel_bold text-white text-base">LOGOUT</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
