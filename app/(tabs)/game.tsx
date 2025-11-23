import SnakeGame from "@/components/SnakeGame";
import { View, ActivityIndicator, Text } from "react-native";
import { useEffect, useState, useMemo } from "react";
import { client } from "@/config/thirdwebClient";
import { useGameScore } from "@/hooks/useGameScore";

const INSPIRATION_TEXTS = [
  "You are crushing it! 🚀",
  "Keep that momentum going 💪",
  "You've got the skills 🎮",
  "On fire right now ✨",
  "Champion energy 🏆",
  "Pure excellence 💎",
];

const Game = () => {
  const {
    highScore,
    isLoading,
    isValidating,
    isSubmittingToContract,
    gameSessionStatus,
    canPlay,
    timeRemaining,
    maxGamesPerHour,
    validateAndSubmitScore,
  } = useGameScore(client);

  const [inspirationText, setInspirationText] = useState("");

  // Select random inspiration text when submission starts
  useEffect(() => {
    if (isSubmittingToContract) {
      const randomIndex = Math.floor(Math.random() * INSPIRATION_TEXTS.length);
      setInspirationText(INSPIRATION_TEXTS[randomIndex]);
    }
  }, [isSubmittingToContract]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-primary">
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    );
  }

  return (
    <>
      <SnakeGame
        currentHighScore={highScore}
        onValidateScore={validateAndSubmitScore}
        isValidating={isValidating}
        canPlay={canPlay}
        gamesPlayedInCurrentHour={gameSessionStatus?.gamesPlayedInCurrentHour || 0}
        maxGamesPerHour={maxGamesPerHour}
        timeRemaining={timeRemaining}
      />
      
      {/* Contract submission status indicator */}
      {isSubmittingToContract && (
        <View className="absolute top-36 left-0 right-0 items-center px-4">
          <Text className="text-warning font-pixel_regular ml-3 font-semibold">
            {inspirationText}
          </Text>
        </View>
      )}
    </>
  );
};

export default Game;