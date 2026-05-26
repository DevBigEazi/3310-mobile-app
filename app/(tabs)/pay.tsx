import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PayScreen() {
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView className="flex-1 px-6 pt-6">
        
        {/* Header Title */}
        <Text className="font-arcade text-warning text-xl text-center mb-10">COMPETITIONS</Text>

        {/* Pulsing Announcement Card */}
        <View className="bg-grey-200 border-2 border-warning rounded-xl p-6 mb-8 items-center">
          <Ionicons name="flash" size={40} color="#FFFF00" />
          <Text className="font-arcade text-warning text-center text-sm leading-6 mt-4">
            PREMIUM TOURNAMENTS COMING SOON!
          </Text>
        </View>

        {/* Info Description */}
        <View className="space-y-6">
          <View className="flex-row items-start space-x-3 mb-6">
            <Ionicons name="card" size={24} color="#00FFFF" />
            <View className="flex-1 ml-3">
              <Text className="font-pixel_bold text-secondary text-base mb-1">Weekly Subscriptions</Text>
              <Text className="font-poppins text-grey-100 text-sm leading-relaxed">
                Phase 2 upgrade will introduce a ₦500/week subscription enabled via local dedicated virtual accounts (Paystack/Monnify).
              </Text>
            </View>
          </View>

          <View className="flex-row items-start space-x-3 mb-6">
            <Ionicons name="logo-bitcoin" size={24} color="#00FF00" />
            <View className="flex-1 ml-3">
              <Text className="font-pixel_bold text-accent text-base mb-1">USDC / USDT Reward Pools</Text>
              <Text className="font-poppins text-grey-100 text-sm leading-relaxed">
                40% of weekly revenue is converted to Avalanche C-Chain stablecoins and distributed transparently to the top 10 players.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start space-x-3 mb-6">
            <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
            <View className="flex-1 ml-3">
              <Text className="font-pixel_bold text-reward text-base mb-1">On-Chain Transparency</Text>
              <Text className="font-poppins text-grey-100 text-sm leading-relaxed">
                Scores and prize allocations are escrowed and verified via the Play3310V1 smart contract on the Avalanche blockchain.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Note */}
        <View className="mt-10 border-t border-grey-200/40 pt-6 pb-12">
          <Text className="font-poppins text-grey text-xs text-center leading-relaxed">
            Free play mode is 100% active. You can play and rank on the global database leaderboards for free today.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
