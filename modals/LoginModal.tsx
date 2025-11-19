import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginModal: React.FC<{
  onEmailSubmit: (email: string) => Promise<void>;
  onGooglePress: () => Promise<void>;
  onApplePress: () => Promise<void>;
  isLoading: boolean;
}> = ({ onEmailSubmit, onGooglePress, onApplePress, isLoading }) => {
  const [email, setEmail] = useState("");

  const handleEmailPress = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    await onEmailSubmit(email);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary px-5 justify-center">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          <View className="items-center">
            {/* Header */}
            <Text
              className="mb-4 text-base font-arcade text-secondary"
              style={{ textShadowColor: "#00FFFF", textShadowRadius: 10 }}
            >
              SIGN IN TO 3310
            </Text>

            {/* Social Login Buttons */}
            <View className="w-full gap-3 mb-5">
              {/* Google Button */}
              <TouchableOpacity
                onPress={onGooglePress}
                disabled={isLoading}
                className={`w-full rounded bg-white py-4 items-center ${isLoading ? "opacity-60" : "opacity-100"}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="primary" size="small" />
                ) : (
                  <View className="flex-row items-center gap-x-4">
                    <FontAwesome name="google" size={24} color="black" />
                    <Text className="font-pixel_bold font-bold text-sm text-primary">
                      CONTINUE WITH GOOGLE
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Apple Button */}
              <TouchableOpacity
                onPress={onApplePress}
                disabled={isLoading}
                className={`w-full rounded bg-grey-200 py-4 items-center ${isLoading ? "opacity-60" : "opacity-100"}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View className="flex-row items-center gap-x-4">
                    <FontAwesome name="apple" size={24} color="white" />
                    <Text className="font-pixel_bold font-bold text-sm text-white">
                      CONTINUE WITH APPLE
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="my-5 w-full flex-row items-center">
              <View className="flex-1 border-t border-grey" />
              <Text className="px-3 font-pixel_regular text-xs text-grey">
                OR
              </Text>
              <View className="flex-1 border-t border-grey" />
            </View>

            {/* Email Input */}

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#808080"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              className="w-full mb-4 rounded border-2 border-secondary bg-grey-200 py-4 px-3 font-terminal text-lg text-white"
            />

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleEmailPress}
              disabled={!email || isLoading}
              className={`w-full rounded py-4 items-center ${
                !email ? "bg-grey" : "bg-accent hover:bg-accent/80"
              } ${isLoading ? "opacity-60" : "opacity-100"}`}
              style={{
                shadowColor: !email ? "transparent" : "#00FF00",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: !email ? 0 : 0.8,
                shadowRadius: 10,
                elevation: !email ? 0 : 8,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="primary" size="small" />
              ) : (
                <Text
                  className={`font-pixel_bold font-bold text-sm ${
                    !email ? "text-grey-100" : "text-primary"
                  }`}
                >
                  CONTINUE WITH EMAIL
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <Text className="mt-6 font-arcade leading-5 text-xs text-center text-grey">
              ZERO CRYPTO KNOWLEDGE NEEDED. JUST HAVE FUN & EARN REAL REWARDS.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginModal;
