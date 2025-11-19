import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const UsernameModal: React.FC<{
    onComplete: (username: string) => Promise<void>;
    isLoading: boolean;
  }> = ({ onComplete, isLoading }) => {
    const [username, setUsername] = useState('');
  
    const handleComplete = async () => {
      if (username.trim().length >= 3) {
        await onComplete(username.trim());
      }
    };
  
    return (
      <SafeAreaView className="flex-1 bg-[#0a0e27]">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
            <View className="items-center">
              {/* Header */}
              <Text
              className="mb-4 text-base leading-6 font-arcade text-secondary"
              style={{ textShadowColor: "#00FFFF", textShadowRadius: 10 }}
            >
              WELCOME, COMPLETE YOUR ONBOARDING AND START HAVING FUN.
            </Text>
  
              {/* Username Input Box */}
              <View className="w-full border-2 border-cyan-400 rounded-lg bg-[#1a1f3a] p-4">
                <Text className="mb-2 font-mono text-xs font-semibold text-pink-500">
                  USERNAME
                </Text>
  
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username (min 3 chars)"
                  placeholderTextColor="#666"
                  maxLength={20}
                  autoCapitalize="none"
                  editable={!isLoading}
                  className="mb-2 rounded border border-cyan-400 bg-[#2a2f4a] px-3 py-2 font-mono text-base text-white"
                />
  
                {username.length > 0 && username.length < 3 && (
                  <Text className="font-mono text-xs text-yellow-600">
                    Username must be at least 3 characters
                  </Text>
                )}
  
                <Text className="mt-2 font-mono text-xs text-gray-600">
                  {username.length}/20
                </Text>
              </View>
  
              {/* Start Playing Button */}
              <TouchableOpacity
                onPress={handleComplete}
                disabled={username.trim().length < 3 || isLoading}
                className={`mt-5 w-full rounded py-3 items-center ${
                  username.trim().length < 3 ? 'bg-gray-600' : 'bg-cyan-400'
                }`}
                style={{
                  opacity: isLoading ? 0.6 : 1,
                  shadowColor: username.trim().length < 3 ? 'transparent' : '#00d9ff',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: username.trim().length < 3 ? 0 : 0.8,
                  shadowRadius: 10,
                  elevation: username.trim().length < 3 ? 0 : 8,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0a0e27" size="small" />
                ) : (
                  <Text className="font-mono text-sm font-bold text-[#0a0e27]">
                    START PLAYING
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };
  
  export default UsernameModal