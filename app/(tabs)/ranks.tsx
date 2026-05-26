import React, { useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  games: number;
  referrals: number;
}

const mockWeekly: LeaderboardEntry[] = [
  { rank: 1, username: 'bob_gamer', score: 46, games: 1, referrals: 25 },
  { rank: 2, username: 'alice_snake', score: 46, games: 4, referrals: 50 },
  { rank: 3, username: 'nokia_master', score: 40, games: 2, referrals: 10 },
  { rank: 4, username: 'retro_hero', score: 32, games: 3, referrals: 15 },
  { rank: 5, username: 'pixel_boss', score: 18, games: 1, referrals: 5 },
];

const mockAllTime: LeaderboardEntry[] = [
  { rank: 1, username: 'retro_hero', score: 98, games: 14, referrals: 15 },
  { rank: 2, username: 'nokia_master', score: 85, games: 22, referrals: 10 },
  { rank: 3, username: 'bob_gamer', score: 46, games: 1, referrals: 25 },
  { rank: 4, username: 'alice_snake', score: 46, games: 4, referrals: 50 },
  { rank: 5, username: 'pixel_boss', score: 30, games: 8, referrals: 5 },
];

export default function RanksScreen() {
  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'ALL_TIME'>('WEEKLY');
  const data = activeTab === 'WEEKLY' ? mockWeekly : mockAllTime;

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 px-6 pt-6">
        
        {/* Title */}
        <Text className="font-arcade text-warning text-xl text-center mb-6">LEADERBOARDS</Text>

        {/* Tab Selectors */}
        <View className="flex-row border-2 border-grey rounded-lg overflow-hidden mb-6">
          <TouchableOpacity 
            className={`flex-1 py-3 items-center ${activeTab === 'WEEKLY' ? 'bg-secondary' : 'bg-grey-200'}`}
            onPress={() => setActiveTab('WEEKLY')}
          >
            <Text className={`font-pixel_bold ${activeTab === 'WEEKLY' ? 'text-primary' : 'text-grey-100'}`}>WEEKLY</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-3 items-center ${activeTab === 'ALL_TIME' ? 'bg-secondary' : 'bg-grey-200'}`}
            onPress={() => setActiveTab('ALL_TIME')}
          >
            <Text className={`font-pixel_bold ${activeTab === 'ALL_TIME' ? 'text-primary' : 'text-grey-100'}`}>ALL-TIME</Text>
          </TouchableOpacity>
        </View>

        {/* Headers */}
        <View className="flex-row justify-between border-b-2 border-grey-200 pb-2 mb-3 px-2">
          <Text className="font-pixel_bold text-grey-100 text-xs w-[12%]">RK</Text>
          <Text className="font-pixel_bold text-grey-100 text-xs w-[38%]">USERNAME</Text>
          <Text className="font-pixel_bold text-grey-100 text-xs w-[18%] text-right">SCORE</Text>
          <Text className="font-pixel_bold text-grey-100 text-xs w-[16%] text-right">GMS</Text>
          <Text className="font-pixel_bold text-grey-100 text-xs w-[16%] text-right">REF</Text>
        </View>

        {/* Leaderboard List */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.rank.toString()}
          renderItem={({ item }) => {
            const isTopRank = item.rank === 1;
            const isSecondRank = item.rank === 2;
            
            // Choose text color based on rank
            let textColorClass = 'text-white';
            if (isTopRank) textColorClass = 'text-accent'; // Lime Green
            else if (isSecondRank) textColorClass = 'text-secondary'; // Neon Cyan

            return (
              <View className="flex-row justify-between items-center py-4 border-b border-grey-200/40 px-2">
                {/* Rank */}
                <Text className={`font-pixel_bold text-xs w-[12%] ${isTopRank ? 'text-reward' : 'text-grey-100'}`}>
                  #{item.rank}
                </Text>
                
                {/* Username */}
                <Text className={`font-pixel text-sm w-[38%] ${textColorClass}`} numberOfLines={1}>
                  {item.username}
                </Text>
                
                {/* Score */}
                <Text className={`font-pixel_bold text-sm w-[18%] text-right ${textColorClass}`}>
                  {item.score}
                </Text>
                
                {/* Games */}
                <Text className="font-pixel text-sm w-[16%] text-right text-grey-100">
                  {item.games}
                </Text>
                
                {/* Referrals */}
                <Text className="font-pixel text-sm w-[16%] text-right text-grey-100">
                  {item.referrals}
                </Text>
              </View>
            );
          }}
        />

      </View>
    </SafeAreaView>
  );
}
