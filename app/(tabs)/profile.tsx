import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDisconnect, useActiveAccount, useActiveWallet } from 'thirdweb/react-native'
import { useRouter } from 'expo-router'

const Profile = () => {
  const { disconnect } = useDisconnect()
  const router = useRouter()
  const activeAccount = useActiveAccount()
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const wallet = useActiveWallet();

  const handleLogout = async () => {
    try {
      setIsDisconnecting(true)

      if (activeAccount && wallet) {
        await disconnect(wallet);
        router.replace('/sign-in');
      }
    } catch (error: any) {
      console.error("Disconnect failed:", error)
      Alert.alert(
        "Logout Error",
        error.message || "Failed to disconnect wallet"
      )
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 items-center justify-center px-4">
        <Text className="font-arcade text-2xl text-accent mb-8">
          PROFILE
        </Text>

        <TouchableOpacity
          onPress={handleLogout}
          disabled={isDisconnecting}
          className={`w-full px-6 py-3 rounded items-center ${
            isDisconnecting ? 'bg-destructive/50' : 'bg-destructive'
          }`}
        >
          {isDisconnecting ? (
            <ActivityIndicator size="small" color="#0a0e27" />
          ) : (
            <Text className="font-pixel_bold text-primary text-lg">
              LOGOUT
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default Profile