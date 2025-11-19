import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const steps = [
    {
      subtitle: "Play.      Compete.      Earn.",
      description:
        "Turn your gaming skills into real rewards. Pay for your utility bills.",
      image: require("@/assets/images/man.png"),
    },
    {
      subtitle: "Simple, just like the old days",
      description:
        "Play Snake weekly, reach the qualification score, climb the leaderboard, and earn real cUSD rewards.",
      image: require("@/assets/images/snake.png"),
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 px-6">
        {/* Logo with */}
        <Image
          source={require("@/assets/images/logo-nobg.png")}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
          className="self-center"
        />

        {/* Content Section */}
        <View className="flex-1">
          <Text className="font-pixel_medium text-lg text-warning text-center mb-6">
            {currentStep.subtitle}
          </Text>

          <Text className="font-pixel_regular text-sm text-gray-200 text-center leading-loose mb-8 px-2">
            {currentStep.description}
          </Text>

          <Image
            source={currentStep.image}
            style={{ width: 300, height: 300 }}
            resizeMode="contain"
            className="self-center"
          />
        </View>

        {/* Bottom Navigation */}
        <View className="gap-4 pb-4">
          {/* Progress Bar */}
          <View className="flex-row gap-2 justify-center items-center">
            {steps.map((_, idx) => (
              <View
                key={idx}
                className={`rounded-full transition-all ${
                  idx === step
                    ? "h-2 bg-secondary"
                    : idx < step
                      ? "h-1 bg-qualified"
                      : "h-1 bg-gray-700"
                }`}
                style={{
                  width: idx === step ? 32 : 8,
                }}
              />
            ))}
            <Text className="font-pixel_regular text-xs text-gray-500 ml-4">
              {step + 1}/{steps.length}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            {step > 0 && (
              <TouchableOpacity
                className="flex-1 border-2 border-gray-600 rounded-lg py-3 items-center active:border-secondary active:bg-secondary/5"
                onPress={handlePrev}
              >
                <Text className="font-pixel_semibold text-gray-300">
                  ← Back
                </Text>
              </TouchableOpacity>
            )}

            {step < 1 && (
              <TouchableOpacity
                className="flex-1 bg-secondary rounded-lg py-3 items-center active:bg-qualified"
                onPress={handleNext}
              >
                <Text className="font-pixel_semibold text-primary text-base">
                  Next →
                </Text>
              </TouchableOpacity>
            )}

            {step === 1 && (
              <TouchableOpacity
                className="flex-1 bg-qualified rounded-lg py-3 items-center active:bg-warning"
                onPress={() => router.push("/(auth)/sign-in")}
              >
                <Text className="font-pixel_semibold text-primary text-base">
                  Play Now 🎮
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Legal text */}
          <Text className="font-pixel_regular text-xs text-gray-600 text-center leading-relaxed">
            By continuing, you agree to our{"\n"}Terms & Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
