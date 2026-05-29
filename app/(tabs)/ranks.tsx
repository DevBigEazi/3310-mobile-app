import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '../../constants/config';

// Unified interface to prevent typescript FlatList type mismatch errors
interface LeaderboardEntry {
  address: string;
  username: string;
  weeklyScore?: number;
  gamesCount?: number;
  highScore?: number;
  totalGames?: number;
  referralPoints: number;
}

export default function RanksScreen(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'weekly' | 'allTime'>('weekly');
  const [weeklyData, setWeeklyData] = useState<LeaderboardEntry[]>([]);
  const [allTimeData, setAllTimeData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Helper: Retrieve authorization headers
  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await AsyncStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  // Fetch Weekly Leaderboard
  const fetchWeeklyLeaderboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/scores/leaderboard/weekly`, { headers });
      if (response.ok) {
        const data = await response.json();
        setWeeklyData(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch All-Time Leaderboard
  const fetchAllTimeLeaderboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/scores/leaderboard/all-time`, { headers });
      if (response.ok) {
        const data = await response.json();
        setAllTimeData(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching all-time leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch data depending on active tab
  const refreshData = useCallback((isSilent = false) => {
    if (activeTab === 'weekly') {
      fetchWeeklyLeaderboard(isSilent);
    } else {
      fetchAllTimeLeaderboard(isSilent);
    }
  }, [activeTab, fetchWeeklyLeaderboard, fetchAllTimeLeaderboard]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Tab switcher
  const handleTabChange = (tab: 'weekly' | 'allTime') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  // Pull-to-refresh
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    refreshData(true);
  };

  // Get place color style
  const getRankStyles = (index: number) => {
    switch (index) {
      case 0: // 1st Place - Gold
        return {
          rankText: 'text-reward font-pixel_bold',
          scoreText: 'text-reward font-arcade text-[11px]',
          bgClass: 'bg-reward/5 border-l-4 border-reward',
          iconName: 'trophy' as const,
          iconColor: '#FFD700',
        };
      case 1: // 2nd Place - Cyan / Silver
        return {
          rankText: 'text-secondary font-pixel_bold',
          scoreText: 'text-secondary font-pixel_bold text-[12px]',
          bgClass: 'bg-secondary/5 border-l-4 border-secondary',
          iconName: 'medal' as const,
          iconColor: '#00FFFF',
        };
      case 2: // 3rd Place - Bronze / Green
        return {
          rankText: 'text-accent font-pixel_bold',
          scoreText: 'text-accent font-pixel_bold text-[12px]',
          bgClass: 'bg-accent/5 border-l-4 border-accent',
          iconName: 'ribbon' as const,
          iconColor: '#00FF00',
        };
      default:
        return {
          rankText: 'text-grey-100 font-pixel',
          scoreText: 'text-white font-pixel text-[12px]',
          bgClass: 'border-l-4 border-transparent',
          iconName: null,
          iconColor: '#C0C0C0',
        };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0E27' }} className="px-4 pt-4">
      {/* Page Header */}
      <View className="items-center mb-6">
        <Text className="font-arcade text-base text-secondary tracking-widest">LEADERBOARD</Text>
        <Text className="font-pixel text-[10px] text-grey-100 mt-1">GLOBAL AGENT STANDINGS</Text>
      </View>

      {/* Tab Switcher */}
      <View className="flex-row border-b-2 border-grey-200/20 mb-4">
        <TouchableOpacity
          onPress={() => handleTabChange('weekly')}
          className={`flex-1 pb-3 items-center ${
            activeTab === 'weekly' ? 'border-b-4 border-secondary' : 'border-b-4 border-transparent'
          }`}
        >
          <Text
            className={`font-pixel_bold text-sm tracking-wider ${
              activeTab === 'weekly' ? 'text-secondary' : 'text-grey-100'
            }`}
          >
            WEEKLY COMP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabChange('allTime')}
          className={`flex-1 pb-3 items-center ${
            activeTab === 'allTime' ? 'border-b-4 border-secondary' : 'border-b-4 border-transparent'
          }`}
        >
          <Text
            className={`font-pixel_bold text-sm tracking-wider ${
              activeTab === 'allTime' ? 'text-secondary' : 'text-grey-100'
            }`}
          >
            ALL-TIME HIGH
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard Table Headers */}
      <View className="flex-row px-4 py-2 border-b border-grey-200/20 bg-grey-200/10 rounded-t-lg">
        <Text className="w-[15%] font-arcade text-[8px] text-grey">RNK</Text>
        <Text className="w-[45%] font-arcade text-[8px] text-grey">AGENT</Text>
        {activeTab === 'weekly' ? (
          <>
            <Text className="w-[20%] font-arcade text-[8px] text-grey text-right">SCORE</Text>
            <Text className="w-[20%] font-arcade text-[8px] text-grey text-right">STATS</Text>
          </>
        ) : (
          <>
            <Text className="w-[20%] font-arcade text-[8px] text-grey text-right">HIGH</Text>
            <Text className="w-[20%] font-arcade text-[8px] text-grey text-right">GMS</Text>
          </>
        )}
      </View>

      {isLoading && !isRefreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00FFFF" />
          <Text className="font-terminal text-sm text-secondary mt-3">LOADING TELEMETRY...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'weekly' ? weeklyData : allTimeData}
          keyExtractor={(item) => item.address}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#00FFFF"
              colors={['#00FFFF']}
            />
          }
          ListEmptyComponent={
            <View className="py-20 items-center justify-center border border-dashed border-grey-200/30 rounded-b-lg">
              <Ionicons name="alert-circle-outline" size={32} color="#808080" />
              <Text className="font-pixel_bold text-xs text-grey-100 mt-2">NO RECORDS REGISTERED</Text>
              <Text className="font-poppins text-[10px] text-grey/80 mt-1">Be the first to record a score!</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const config = getRankStyles(index);
            return (
              <View
                className={`flex-row items-center border-b border-grey-200/10 py-3 px-4 ${config.bgClass}`}
              >
                {/* Rank Number */}
                <View className="w-[15%] flex-row items-center">
                  <Text className={config.rankText}>{index + 1}</Text>
                  {config.iconName && (
                    <Ionicons 
                      name={config.iconName} 
                      size={10} 
                      color={config.iconColor} 
                      style={{ marginLeft: 2 }} 
                    />
                  )}
                </View>

                {/* Username / Address */}
                <Text className="w-[45%] font-pixel_semibold text-xs text-white" numberOfLines={1}>
                  {item.username}
                </Text>

                {/* Weekly Tab Columns */}
                {activeTab === 'weekly' ? (
                  <>
                    {/* Weekly Accumulated Score */}
                    <Text className={`w-[20%] text-right ${config.scoreText}`}>
                      {item.weeklyScore}
                    </Text>
                    {/* Mini Stats: Games Count and Referral Points */}
                    <View className="w-[20%] items-end justify-center">
                      <Text className="font-terminal text-[11px] text-grey-100">
                        {item.gamesCount}g
                      </Text>
                      <Text className="font-terminal text-[9px] text-accent mt-0.5">
                        +{item.referralPoints} pts
                      </Text>
                    </View>
                  </>
                ) : (
                  /* All-Time Tab Columns */
                  <>
                    {/* Single-Game High Score */}
                    <Text className={`w-[20%] text-right ${config.scoreText}`}>
                      {item.highScore}
                    </Text>
                    {/* Total games played */}
                    <Text className="w-[20%] font-terminal text-[11px] text-grey-100 text-right">
                      {item.totalGames}
                    </Text>
                  </>
                )}
              </View>
            );
          }}
          className="flex-1 bg-grey-200/5 rounded-b-lg border-x border-b border-grey-200/20 mb-4"
        />
      )}
    </SafeAreaView>
  );
}
