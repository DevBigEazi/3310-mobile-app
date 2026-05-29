import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BACKEND_URL } from '../constants/config';

export interface GameSessionInfo {
  playerAddress: string;
  dayId: string;
  weekNumber: number;
  gamesPlayedInCurrentHour: number;
  firstGameInHour: string | null;
  currentLives: number;
  nextRefillAt: string | null;
  dailyAccumulatedScore: number;
  weeklyAccumulatedScore: number;
}

export const useGameScore = () => {
  const queryClient = useQueryClient();
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  // Formatted timer strings
  const [refillCountdown, setRefillCountdown] = useState<string>('');
  const [hourlyCountdown, setHourlyCountdown] = useState<string>('');

  const timerIntervalRef = useRef<NodeJS.Timeout | number | null>(null);

  // Helper: Retrieve authorization headers
  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await AsyncStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  // TanStack Query to fetch session info
  const { data: sessionInfo, isLoading: isQueryLoading } = useQuery<GameSessionInfo | null, Error>({
    queryKey: ['gameSession'],
    queryFn: async (): Promise<GameSessionInfo | null> => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/api/scores/game-session`, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch session. Status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('[useGameScore] Error fetching session:', error);
        return null;
      }
    },
  });

  const lives = sessionInfo?.currentLives ?? 5;
  const gamesPlayedInCurrentHour = sessionInfo?.gamesPlayedInCurrentHour ?? 0;
  const nextRefillAt = sessionInfo?.nextRefillAt ?? null;
  const firstGameInHour = sessionInfo?.firstGameInHour ?? null;
  const weeklyScore = sessionInfo?.weeklyAccumulatedScore ?? 0;

  // Flags
  const isOutOfLives = lives <= 0;
  const isHourLimitReached = gamesPlayedInCurrentHour >= 5;

  // Fetch or sync the session status manually (calls refetch under the hood)
  const fetchSession = useCallback(async (): Promise<GameSessionInfo | null> => {
    await queryClient.invalidateQueries({ queryKey: ['gameSession'] });
    return queryClient.getQueryData<GameSessionInfo>(['gameSession']) || null;
  }, [queryClient]);

  // Mutations
  const startMutation = useMutation<string | null, Error, void>({
    mutationFn: async (): Promise<string | null> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/scores/start`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to start game');
      }

      const data = await response.json();
      setGameSessionId(data.gameSessionId);
      return data.gameSessionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameSession'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['gameSession'] });
    }
  });

  const submitMutation = useMutation<{ isValid: boolean; updatedScore: number } | null, Error, number>({
    mutationFn: async (score: number): Promise<{ isValid: boolean; updatedScore: number } | null> => {
      if (!gameSessionId) {
        console.error('[useGameScore] Cannot submit score without an active gameSessionId');
        return null;
      }
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/scores/validate-score`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          gameSessionId,
          score,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to validate score');
      }

      const data = await response.json();
      setGameSessionId(null); // Reset game session

      return {
        isValid: data.isValid,
        updatedScore: data.weeklyAccumulatedScore,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameSession'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['gameSession'] });
    }
  });

  // Start a new game session wrapper
  const startGameAttempt = useCallback(async (): Promise<string | null> => {
    try {
      return await startMutation.mutateAsync();
    } catch (error) {
      console.error('[useGameScore] Error starting game:', error);
      return null;
    }
  }, [startMutation]);

  // Submit and validate the score wrapper
  const submitGameScore = useCallback(
    async (score: number): Promise<{ isValid: boolean; updatedScore: number } | null> => {
      try {
        return await submitMutation.mutateAsync(score);
      } catch (error) {
        console.error('[useGameScore] Error validating/submitting score:', error);
        return null;
      }
    },
    [submitMutation]
  );

  const isLoading = isQueryLoading || startMutation.isPending || submitMutation.isPending;

  // Timer loop for handling refill and hourly countdowns
  useEffect(() => {
    const runTimers = () => {
      const now = Date.now();
      let shouldRefreshSession = false;

      // 1. Lives refill countdown
      if (lives < 5 && nextRefillAt) {
        const refillTime = new Date(nextRefillAt).getTime();
        const diffMs = refillTime - now;

        if (diffMs <= 0) {
          setRefillCountdown('');
          shouldRefreshSession = true;
        } else {
          const totalSecs = Math.floor(diffMs / 1000);
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setRefillCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }
      } else {
        setRefillCountdown('');
      }

      // 2. Hourly limit countdown (resets 1 hour after firstGameInHour)
      if (gamesPlayedInCurrentHour >= 5 && firstGameInHour) {
        const firstGameTime = new Date(firstGameInHour).getTime();
        const limitExpiryTime = firstGameTime + 60 * 60 * 1000;
        const diffMs = limitExpiryTime - now;

        if (diffMs <= 0) {
          setHourlyCountdown('');
          shouldRefreshSession = true;
        } else {
          const totalSecs = Math.floor(diffMs / 1000);
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setHourlyCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }
      } else {
        setHourlyCountdown('');
      }

      if (shouldRefreshSession) {
        queryClient.invalidateQueries({ queryKey: ['gameSession'] });
      }
    };

    runTimers(); // run immediately
    timerIntervalRef.current = setInterval(runTimers, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [lives, nextRefillAt, gamesPlayedInCurrentHour, firstGameInHour, queryClient]);

  return {
    lives,
    gamesPlayedInCurrentHour,
    nextRefillAt,
    firstGameInHour,
    weeklyScore,
    refillCountdown,
    hourlyCountdown,
    isOutOfLives,
    isHourLimitReached,
    isLoading,
    gameSessionId,
    fetchSession,
    startGameAttempt,
    submitGameScore,
  };
};
