import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [lives, setLives] = useState<number>(5);
  const [gamesPlayedInCurrentHour, setGamesPlayedInCurrentHour] = useState<number>(0);
  const [nextRefillAt, setNextRefillAt] = useState<string | null>(null);
  const [firstGameInHour, setFirstGameInHour] = useState<string | null>(null);
  const [weeklyScore, setWeeklyScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  // Formatted timer strings
  const [refillCountdown, setRefillCountdown] = useState<string>('');
  const [hourlyCountdown, setHourlyCountdown] = useState<string>('');

  // Flags
  const isOutOfLives = lives <= 0;
  const isHourLimitReached = gamesPlayedInCurrentHour >= 5;

  const timerIntervalRef = useRef<NodeJS.Timeout | number | null>(null);

  // Helper: Retrieve authorization headers
  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await AsyncStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  // Fetch or sync the session status with backend
  const fetchSession = useCallback(async (): Promise<GameSessionInfo | null> => {
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/scores/game-session`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch session. Status: ${response.status}`);
      }

      const data: GameSessionInfo = await response.json();
      setLives(data.currentLives);
      setGamesPlayedInCurrentHour(data.gamesPlayedInCurrentHour);
      setNextRefillAt(data.nextRefillAt);
      setFirstGameInHour(data.firstGameInHour);
      setWeeklyScore(data.weeklyAccumulatedScore);
      return data;
    } catch (error) {
      console.error('[useGameScore] Error fetching session:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start a new game session
  const startGameAttempt = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true);
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
      setLives(data.currentLives);
      setGamesPlayedInCurrentHour(data.gamesPlayedInCurrentHour);
      return data.gameSessionId;
    } catch (error) {
      console.error('[useGameScore] Error starting game:', error);
      // Re-sync session state to ensure UI matches database limits
      await fetchSession();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSession]);

  // Submit and validate the score on game over
  const submitGameScore = useCallback(
    async (score: number): Promise<{ isValid: boolean; updatedScore: number } | null> => {
      if (!gameSessionId) {
        console.error('[useGameScore] Cannot submit score without an active gameSessionId');
        return null;
      }

      try {
        setIsLoading(true);
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
        setLives(data.currentLives);
        setGamesPlayedInCurrentHour(data.gamesPlayedInCurrentHour);
        setNextRefillAt(data.nextRefillAt);
        setWeeklyScore(data.weeklyAccumulatedScore);
        setGameSessionId(null); // Reset game session

        return {
          isValid: data.isValid,
          updatedScore: data.weeklyAccumulatedScore,
        };
      } catch (error) {
        console.error('[useGameScore] Error validating/submitting score:', error);
        setGameSessionId(null);
        await fetchSession();
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [gameSessionId, fetchSession]
  );

  // Initial load
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

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
        fetchSession();
      }
    };

    runTimers(); // run immediately
    timerIntervalRef.current = setInterval(runTimers, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [lives, nextRefillAt, gamesPlayedInCurrentHour, firstGameInHour, fetchSession]);

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
