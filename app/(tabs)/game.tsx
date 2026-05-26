import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GameScreen() {
  const lives = 5;
  const maxLives = 5;
  const gamesPlayed = 0;
  const maxGamesPerHour = 5;

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 justify-between items-center px-6 py-10">
        
        {/* Telemetry Header */}
        <View className="w-full flex-row justify-between items-center bg-grey-200 border-2 border-grey p-4 rounded-lg">
          <View>
            <Text className="font-terminal text-secondary text-2xl">LIVES: {lives}/{maxLives}</Text>
            <Text className="font-terminal text-warning text-lg mt-1">NEXT REFILL IN --:--</Text>
          </View>
          <View className="items-end">
            <Text className="font-terminal text-accent text-2xl">HOURLY CAP: {gamesPlayed}/{maxGamesPerHour}</Text>
            <Text className="font-terminal text-grey-100 text-lg mt-1">LIMIT ACTIVE</Text>
          </View>
        </View>

        {/* Nostalgic Branding Center */}
        <View className="items-center my-auto">
          <Image 
            source={require('../../assets/images/logo-nobg.png')} 
            className="w-80 h-40" 
            resizeMode="contain" 
          />
          <Text className="font-arcade text-warning text-xs text-center leading-loose mt-4">
            - RETRO SNAKE EDITION -
          </Text>
          <Text className="font-pixel text-grey-100 text-sm text-center mt-2 px-8">
            Control the snake, collect points, and compete on the weekly global leaderboard!
          </Text>
        </View>

        {/* Control Actions */}
        <View className="w-full space-y-4 items-center">
          <TouchableOpacity 
            className="w-full bg-accent border-4 border-white py-4 rounded-xl active:opacity-80"
            style={{ shadowColor: '#00FF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 }}
          >
            <Text className="font-arcade text-primary text-center text-lg">START GAME</Text>
          </TouchableOpacity>
          
          <Text className="font-terminal text-grey-100 text-sm mt-4 text-center">
            VERSION 1.0 (FREE PLAY)
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
