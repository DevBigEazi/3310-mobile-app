import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react-native";
import { prepareContractCall, getContract, defineChain } from "thirdweb";
import { ThirdwebClient } from "thirdweb";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/config/api";
import { ABI } from "@/abi/Abi";

const SERVER_BEARER = process.env.EXPO_PUBLIC_SERVER_BEARER;
const MIN_QUALIFICATION_SCORE = 500;
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS || "";
const MAX_GAMES_PER_HOUR = 5;
const CHAIN_ID = 11142220;

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

interface WeeklyStatsResponse {
  success: boolean;
  weekId: number;
  playerAddress: string;
  score: number;
  gameScore: number;
  gameCount: number;
  referralPoints: number;
  signature: string;
  message: string;
}

export const useGameScore = (client: ThirdwebClient) => {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } = useSendTransaction();
  
  const [highScore, setHighScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isSubmittingToContract, setIsSubmittingToContract] = useState<boolean>(false);
  const [gameSessionStatus, setGameSessionStatus] = useState<GameSessionStatus | null>(null);
  const [canPlay, setCanPlay] = useState<boolean>(true);
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00");
  const [lastSubmittedScore, setLastSubmittedScore] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const fetchedRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chain = useMemo(() => defineChain(CHAIN_ID), []);

  // Initialize contract
  const contract = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: CONTRACT_ADDRESS,
        abi: ABI
      }),
    [client, chain]
  );

  // Start countdown timer
  const startCountdownTimer = useCallback((initialMs: number) => {
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
        // Refresh status will be called from component
      } else {
        const seconds = Math.floor((timeLeftMs % 60000) / 1000);
        const minutes = Math.floor(timeLeftMs / 60000);
        setTimeRemaining(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      }
    }, 1000);
  }, []);

  // Fetch game session status
  const fetchGameSessionStatus = useCallback(async () => {
    if (!account?.address) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scores/game-session/${account.address}`,
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
      setError("Failed to fetch game session");
    }
  }, [account?.address, startCountdownTimer]);

  // Submit score to smart contract
  const submitScoreToContract = useCallback(
    async (weeklyAccumulatedScore: number) => {
      if (!account?.address) {
        Alert.alert("Error", "Wallet not connected");
        return false;
      }

      // Only submit if score meets minimum qualification
      if (weeklyAccumulatedScore < MIN_QUALIFICATION_SCORE) {
        console.log("Score below qualification threshold:", weeklyAccumulatedScore);
        return true; // Don't block, just skip submission
      }

      // Check if score has increased since last submission
      if (weeklyAccumulatedScore <= lastSubmittedScore) {
        console.log("Score hasn't increased since last submission");
        return true; // Don't submit same or lower score
      }

      setIsSubmittingToContract(true);
      setError(null);

      try {
        // Step 1: Get signed data from backend
        const statsResponse = await fetch(
          `${API_BASE_URL}/api/scores/weekly-stats/${account.address}`
        );

        if (!statsResponse.ok) {
          const errorData = await statsResponse.json();
          throw new Error(errorData.error || "Failed to get weekly stats");
        }

        const statsData: WeeklyStatsResponse = await statsResponse.json();

        console.log("Weekly stats received:", statsData);

        // Step 2: Prepare contract call
        const transaction = prepareContractCall({
          contract,
          method: "submitScore",
          params: [
            BigInt(statsData.weekId),
            BigInt(statsData.score),
            BigInt(statsData.gameScore),
            BigInt(statsData.gameCount),
            BigInt(statsData.referralPoints),
            statsData.signature as `0x${string}`,
          ],
        });

        // Step 3: Send transaction using the hook
        return new Promise<boolean>((resolve) => {
          sendTransaction(transaction, {
            onSuccess: (receipt) => {
              console.log("Transaction sent:", receipt.transactionHash);

              // Update last submitted score to prevent duplicate submissions
              setLastSubmittedScore(statsData.score);
              setIsSubmittingToContract(false);
              resolve(true);
            },
            onError: (error) => {
              console.error("Contract submission error:", error);

              // Parse error message
              let errorMessage = "Failed to submit score to blockchain";
              if (error.message) {
                if (error.message.includes("ScoreBelowQualification")) {
                  errorMessage = `Score must be at least ${MIN_QUALIFICATION_SCORE} to qualify`;
                } else if (error.message.includes("NotCurrentWeek")) {
                  errorMessage = "Can only submit scores for the current week";
                } else if (error.message.includes("InvalidSignature")) {
                  errorMessage = "Invalid signature. Please try again.";
                } else if (error.message.includes("user rejected") || error.message.includes("User rejected")) {
                  errorMessage = "Transaction cancelled by user";
                } else if (error.message.includes("401") || error.message.includes("delegation")) {
                  errorMessage = "Authentication error. Please try reconnecting your wallet.";
                  console.log("Delegation/Auth error - wallet may need reconnection");
                } else if (error.message.includes("insufficient funds")) {
                  errorMessage = "Insufficient funds to pay for transaction gas";
                } else {
                  errorMessage = error.message;
                }
              }

              setError(errorMessage);
              Alert.alert("Submission Error", errorMessage);
              setIsSubmittingToContract(false);
              resolve(false);
            },
          });
        });
      } catch (error: any) {
        console.error("Contract submission error:", error);
        const errorMessage = error.message || "Failed to submit score";
        setError(errorMessage);
        Alert.alert("Submission Error", errorMessage);
        setIsSubmittingToContract(false);
        return false;
      }
    },
    [account, contract, lastSubmittedScore, sendTransaction]
  );

  // Validate and submit score
  const validateAndSubmitScore = useCallback(
    async (finalScore: number, gameSessionId: string): Promise<boolean> => {
      if (!account) {
        Alert.alert("Error", "Wallet not connected");
        return false;
      }

      setIsValidating(true);
      setError(null);

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
              playerAddress: account.address,
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

        if (data.success) {
          // Update high score with the new accumulated score from backend
          setHighScore(data.weeklyAccumulatedScore);

          // Check if score meets minimum qualification and submit to contract
          if (data.weeklyAccumulatedScore >= MIN_QUALIFICATION_SCORE) {
            submitScoreToContract(data.weeklyAccumulatedScore).catch((error) => {
              console.error("Background contract submission failed:", error);
            });
          }

          // Refresh full game session status to get updated gamesPlayedInCurrentHour
          await fetchGameSessionStatus();
        }

        return true;
      } catch (error: any) {
        console.error("Score validation error:", error);
        const errorMessage = error.message || "Failed to validate score";
        setError(errorMessage);
        Alert.alert("Validation Error", errorMessage);
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [account, fetchGameSessionStatus, submitScoreToContract]
  );

  // Fetch game data on mount
  useEffect(() => {
    if (fetchedRef.current) return;

    const loadGameData = async () => {
      if (!account?.address) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/scores/game-session/${account.address}`,
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
        setError("Failed to load game data");
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
  }, [account?.address, startCountdownTimer]);

  // Reset last submitted score when week changes
  useEffect(() => {
    const checkWeekChange = async () => {
      if (gameSessionStatus?.weekNumber) {
        const savedWeek = parseInt(
          (await AsyncStorage.getItem("currentWeek")) || "0",
          10
        );

        // New week started, reset last submitted score
        if (savedWeek !== gameSessionStatus.weekNumber) {
          setLastSubmittedScore(0);
          await AsyncStorage.setItem("currentWeek", gameSessionStatus.weekNumber.toString());
        }
      }
    };

    checkWeekChange();
  }, [gameSessionStatus?.weekNumber]);

  return {
    highScore,
    isLoading,
    isValidating,
    isSubmittingToContract,
    gameSessionStatus,
    canPlay,
    timeRemaining,
    maxGamesPerHour: MAX_GAMES_PER_HOUR,
    error,
    validateAndSubmitScore,
    fetchGameSessionStatus,
    submitScoreToContract,
  };
};