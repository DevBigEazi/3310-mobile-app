import SnakeGame from "@/components/SnakeGame";
import { useActiveAccount } from "thirdweb/react-native";
import { useEffect, useState, useRef, useCallback } from "react";
import { API_BASE_URL } from "@/config/api";
import { View, ActivityIndicator, Alert, Text } from "react-native";

const SERVER_BEARER = process.env.EXPO_PUBLIC_SERVER_BEARER;

interface GameSessionStatus {
  playerAddress: string;
  weekNumber: number;
  weeklyAccumulatedScore: number;
  gamesPlayedInCurrentHour: number;
  gamesRemaining: number;
  canPlay: boolean;
  timeRemaining: {
    ms: number;
    formatted: string;
    resetTime: string;
  };
  isSubmissionPeriod: boolean;
}

const MAX_GAMES_PER_HOUR = 5;

const Game = () => {
  const [highScore, setHighScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [gameSessionStatus, setGameSessionStatus] = useState<GameSessionStatus | null>(null);
  const [canPlay, setCanPlay] = useState<boolean>(true);
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00");
  const activeAccount = useActiveAccount();
  const fetchedRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch game session status
  const fetchGameSessionStatus = useCallback(async () => {
    if (!activeAccount?.address) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scores/game-session/${activeAccount.address}`,
        {
          headers: {
            Authorization: `Bearer ${SERVER_BEARER}`,
          },
        }
      );

      if (response.ok) {
        const data: GameSessionStatus = await response.json();
        setGameSessionStatus(data);
        setCanPlay(data.canPlay);
        setTimeRemaining(data.timeRemaining.formatted);

        // Start countdown timer if user can't play
        if (!data.canPlay && data.timeRemaining.ms > 0) {
          startCountdownTimer(data.timeRemaining.ms);
        }
      }
    } catch (error) {
      console.error("Error fetching game session status:", error);
    }
  }, [activeAccount?.address]);

  // Start countdown timer
  const startCountdownTimer = (initialMs: number) => {
    // Clear existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    let timeLeftMs = initialMs;

    timerIntervalRef.current = setInterval(() => {
      timeLeftMs -= 1000;

      if (timeLeftMs <= 0) {
        setCanPlay(true);
        setTimeRemaining("00:00");
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        // Refresh status
        fetchGameSessionStatus();
      } else {
        const seconds = Math.floor((timeLeftMs % 60000) / 1000);
        const minutes = Math.floor(timeLeftMs / 60000);
        setTimeRemaining(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      }
    }, 1000);
  };

  // Fetch high score and game session status on mount
  useEffect(() => {
    if (fetchedRef.current) return;

    const loadGameData = async () => {
      if (!activeAccount?.address) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/scores/game-session/${activeAccount.address}`,
          {
            headers: {
              Authorization: `Bearer ${SERVER_BEARER}`,
            },
          }
        );

        if (response.ok) {
          const data: GameSessionStatus = await response.json();
          setHighScore(data.weeklyAccumulatedScore || 0);
          setGameSessionStatus(data);
          setCanPlay(data.canPlay);
          setTimeRemaining(data.timeRemaining.formatted);

          // Start countdown timer if user can't play
          if (!data.canPlay && data.timeRemaining.ms > 0) {
            startCountdownTimer(data.timeRemaining.ms);
          }
        } else {
          setHighScore(0);
          setCanPlay(true);
        }
      } catch (error) {
        console.error("Error fetching game data:", error);
        setHighScore(0);
        setCanPlay(true);
      } finally {
        setIsLoading(false);
        fetchedRef.current = true;
      }
    };

    loadGameData();

    // Cleanup timer on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeAccount?.address]);

  const validateAndSubmitScore = useCallback(
    async (finalScore: number, gameSessionId: string): Promise<boolean> => {
      if (!activeAccount) {
        Alert.alert("Error", "Wallet not connected");
        return false;
      }

      setIsValidating(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/scores/validate-score`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SERVER_BEARER}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              playerAddress: activeAccount.address,
              score: finalScore,
              gameSessionId: gameSessionId,
              timestamp: Math.floor(Date.now() / 1000),
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Score validation failed");
        }

        console.log("Score validated:", data);

        // Update high score with the new accumulated score from backend
        setHighScore(data.weeklyAccumulatedScore);

        // Refresh full game session status to get updated gamesPlayedInCurrentHour
        await fetchGameSessionStatus();

        return true;
      } catch (error: any) {
        console.error("Score validation error:", error);
        Alert.alert(
          "Validation Error",
          error.message || "Failed to validate score"
        );
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [activeAccount, fetchGameSessionStatus]
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-primary">
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    );
  }

  return (
    <SnakeGame
        currentHighScore={highScore}
        onValidateScore={validateAndSubmitScore}
        isValidating={isValidating}
        canPlay={canPlay}
        gamesPlayedInCurrentHour={gameSessionStatus?.gamesPlayedInCurrentHour || 0}
        maxGamesPerHour={MAX_GAMES_PER_HOUR}
        timeRemaining={timeRemaining}
      />
  );
};

export default Game;