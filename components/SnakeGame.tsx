import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, GestureResponderEvent, Modal, Share, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AVATARS } from '../constants/config';
import RetroCrtEffects from './auth/RetroCrtEffects';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

const GRID_SIZE = 20;
const INITIAL_SPEED = 200;

const getThemeColors = (color: string) => {
  switch (color) {
    case '#00FF00': // LIME PYTHON
      return {
        bg: '#041508',        // deep green-black
        canvasBg: '#082510',  // dark forest green
        gridLine: 'rgba(0, 255, 0, 0.08)',
        glow: 'rgba(0, 255, 0, 0.15)',
        textMuted: '#8cbe94',
      };
    case '#FFD700': // GOLDEN COBRA
      return {
        bg: '#120E02',        // deep amber-black
        canvasBg: '#221B05',  // dark amber/brown
        gridLine: 'rgba(255, 215, 0, 0.08)',
        glow: 'rgba(255, 215, 0, 0.15)',
        textMuted: '#c8b488',
      };
    case '#FF00FF': // MAGENTA MAMBA
      return {
        bg: '#150415',        // deep purple-black
        canvasBg: '#280828',  // dark violet
        gridLine: 'rgba(255, 0, 255, 0.08)',
        glow: 'rgba(255, 0, 255, 0.15)',
        textMuted: '#c88ca4',
      };
    case '#00FFFF': // CYAN VIPER
    default:
      return {
        bg: '#05131b',        // deep cyan-black
        canvasBg: '#092230',  // dark teal/cyan
        gridLine: 'rgba(0, 255, 255, 0.08)',
        glow: 'rgba(0, 255, 255, 0.15)',
        textMuted: '#8cb4c4',
      };
  }
};

interface SnakeGameProps {
  lives: number;
  gamesPlayedInCurrentHour: number;
  refillCountdown: string;
  hourlyCountdown: string;
  isOutOfLives: boolean;
  isHourLimitReached: boolean;
  isLoading: boolean;
  weeklyScore: number;
  startGameAttempt: () => Promise<string | null>;
  submitGameScore: (score: number) => Promise<{ isValid: boolean; updatedScore: number } | null>;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
}

export default function SnakeGame({
  lives,
  gamesPlayedInCurrentHour,
  refillCountdown,
  hourlyCountdown,
  isOutOfLives,
  isHourLimitReached,
  isLoading: isSessionLoading,
  weeklyScore,
  startGameAttempt,
  submitGameScore,
}: SnakeGameProps): React.JSX.Element {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  // Available height for canvas. Budget: Top Area (~120px) + Bottom Area (~250px) + Padding/Margins (~60px) = ~430px overhead.
  const maxCanvasHeight = screenHeight - 430;
  const maxCanvasWidth = screenWidth - 32;
  const maxCanvasSize = Math.min(maxCanvasWidth, maxCanvasHeight);
  const CELL_SIZE = Math.floor(maxCanvasSize / GRID_SIZE);
  const canvasWidth = GRID_SIZE * CELL_SIZE;
  const canvasHeight = GRID_SIZE * CELL_SIZE;

  // Game states
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [controlMode, setControlMode] = useState<'buttons' | 'swipe'>('buttons');
  
  const [avatarName, setAvatarName] = useState<string>('CYAN VIPER');
  const [avatarColor, setAvatarColor] = useState<string>('#00FFFF');
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED);
  const [avatar, setAvatar] = useState<(typeof AVATARS)[0]>(AVATARS[0]);

  const theme = getThemeColors(avatar.color);

  const gameIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const directionRef = useRef<Direction>('RIGHT');
  directionRef.current = direction;
  const lastTickDirectionRef = useRef<Direction>('RIGHT');
  
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Load configuration and local high score on focus and game state change
  useFocusEffect(
    useCallback(() => {
      const loadConfig = async () => {
        try {
          const storedName = await AsyncStorage.getItem('registered_avatar_name');
          const storedHighScore = await AsyncStorage.getItem('snake_high_score');
          
          if (storedHighScore) {
            setHighScore(parseInt(storedHighScore));
          }

          const selectedAvatar = AVATARS.find(a => a.name === storedName) || AVATARS[0];
          setAvatarName(selectedAvatar.name);
          setAvatarColor(selectedAvatar.color);
          setAvatar(selectedAvatar);
          setSpeed(INITIAL_SPEED); 
        } catch (error) {
          console.error('Failed to load avatar/highscore settings', error);
        }
      };
      loadConfig();
    }, [isGameStarted])
  );

  // Generate food item positions
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    while (true) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const isOnSnake = currentSnake.some(segment => segment.x === x && segment.y === y);
      if (!isOnSnake) {
        return { x, y };
      }
    }
  }, []);

  // Play Game triggers
  const handleStartGame = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isOutOfLives || isHourLimitReached) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const sessionId = await startGameAttempt();
    if (!sessionId) return;

    // Reset board states
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setDirection('RIGHT');
    setScore(0);
    lastTickDirectionRef.current = 'RIGHT';
    setIsPaused(false);
    setIsGameOver(false);
    setIsGameStarted(true);
  };

  // Submit and Sync score with backend
  const handleGameOver = useCallback(async (finalScore: number) => {
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setIsGameOver(true);
    setIsValidating(true);

    try {
      const result = await submitGameScore(finalScore);
      if (result) {
        // Update high score locally if higher
        if (result.isValid && finalScore > highScore) {
          setHighScore(finalScore);
          await AsyncStorage.setItem('snake_high_score', finalScore.toString());
        }
        
        if (result.isValid) {
          setShowShareModal(true);
        }
      }
    } catch (error) {
      console.error('Error validating score:', error);
    } finally {
      setIsValidating(false);
    }
  }, [submitGameScore, highScore]);

  // Game loop tick function
  const gameTick = useCallback(() => {
    // Record the direction we are processing for this tick
    lastTickDirectionRef.current = directionRef.current;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      let newHead = { ...head };

      switch (directionRef.current) {
        case 'UP':
          newHead.y -= 1;
          break;
        case 'DOWN':
          newHead.y += 1;
          break;
        case 'LEFT':
          newHead.x -= 1;
          break;
        case 'RIGHT':
          newHead.x += 1;
          break;
      }

      // Border or self collision checks
      const isWallCollision = 
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE;
      
      const isSelfCollision = prevSnake.some(
        (segment, idx) => idx > 0 && segment.x === newHead.x && segment.y === newHead.y
      );

      if (isWallCollision || isSelfCollision) {
        setTimeout(() => handleGameOver(score), 0);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setScore(prevScore => prevScore + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, score, generateFood, handleGameOver]);

  // Manage Game interval timer
  useEffect(() => {
    if (isGameStarted && !isPaused && !isGameOver) {
      gameIntervalRef.current = setInterval(gameTick, speed);
    } else {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    }

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [isGameStarted, isPaused, isGameOver, gameTick, speed]);

  // Steering direction buttons mapping
  const changeDirection = (newDir: Direction) => {
    if (isGameOver || isPaused || !isGameStarted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const opposites: Record<string, string> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };

    // Check against the actual direction of the last processed tick to prevent 180-degree self-collisions
    if (opposites[lastTickDirectionRef.current] !== newDir) {
      setDirection(newDir);
    }
  };

  const togglePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(prev => !prev);
  };

  const resetGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGameStarted(false);
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
  };

  // Swiping controls
  const handleTouchStart = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    touchStartRef.current = { x: pageX, y: pageY };
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    const startX = touchStartRef.current?.x;
    const startY = touchStartRef.current?.y;

    if (startX !== undefined && startY !== undefined) {
      const deltaX = pageX - startX;
      const deltaY = pageY - startY;
      const threshold = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          changeDirection('RIGHT');
        } else {
          changeDirection('LEFT');
        }
      } else if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          changeDirection('DOWN');
        } else {
          changeDirection('UP');
        }
      }
    }
  };

  // Share score
  const handleShare = async (platform: string) => {
    const text = `I just scored ${score} points on @play_3310! 🐍 Can you beat me?`;
    try {
      if (platform === 'native') {
        await Share.share({ message: text });
      } else {
        const urls: Record<string, string> = {
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
          whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
          telegram: `https://t.me/share/url?text=${encodeURIComponent(text)}`,
        };
        if (urls[platform]) {
          console.log('Share link:', urls[platform]);
        }
      }
    } catch (error) {
      console.error('Share error:', error);
    }
    setShowShareModal(false);
  };

  // Removed static canvas width/height variables, calculated dynamically inside component body.

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 w-full px-4 py-2 items-center justify-between">
        {/* Top Console Branding, Status & Stats */}
        <View className="items-center w-full">
        {/* Branding */}
        <View className="items-center mb-0.5 mt-1">
          <Text className="font-arcade text-[10px] tracking-[2px] opacity-80" style={{ color: avatar.color }}>
            // 3310 CONSOLE //
          </Text>
          <Text className="font-pixel text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
            SECURE CONNECTION ESTABLISHED
          </Text>
        </View>
        
        {/* Connection status line / subtitle */}
        <Text className="font-terminal text-[14px] text-center mb-2" style={{ color: theme.textMuted }}>
          {avatarName} Active // Consume 1 life to record score
        </Text>

        {/* Score and Stats Display */}
        <View className="flex-row justify-between w-full px-4 mb-2">
          <View>
            <Text className="font-pixel_regular text-[9px] mb-0.5" style={{ color: avatar.color }}>SCORE</Text>
            <Text className="font-arcade text-lg" style={{ color: avatar.color }}>{score}</Text>
          </View>
          <View>
            <Text className="font-pixel_regular text-[9px] mb-0.5" style={{ color: avatar.color }}>THIS WEEK</Text>
            <Text className="font-arcade text-lg" style={{ color: avatar.color }}>{weeklyScore}</Text>
          </View>
          <View>
            <Text className="font-pixel_regular text-[9px] mb-0.5" style={{ color: avatar.color }}>GAMES/HOUR</Text>
            <Text className="font-arcade text-lg" style={{ color: isHourLimitReached ? '#FF0000' : avatar.color }}>
              {gamesPlayedInCurrentHour}/5
            </Text>
          </View>
        </View>
      </View>

        {/* Game Canvas Container */}
        <View
          onTouchStart={controlMode === 'swipe' && isGameStarted ? handleTouchStart : undefined}
          onTouchEnd={controlMode === 'swipe' && isGameStarted ? handleTouchEnd : undefined}
          className="border-2 rounded-xl overflow-hidden mb-6 relative"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            borderColor: avatar.color,
            backgroundColor: theme.canvasBg,
          }}
        >
          {/* CRT scan overlay */}
          <RetroCrtEffects bezelColor={theme.bg} bezelWidth={0} />

          {/* Game Not Started Overlay */}
          {!isGameStarted && (
            <View className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
              <View 
                className="border p-5 rounded-lg items-center w-[85%]"
                style={{ borderColor: avatar.color, backgroundColor: theme.canvasBg }}
              >
                {isOutOfLives ? (
                  <>
                    <Text className="font-arcade leading-7 text-sm text-destructive text-center mb-3">
                      Out of Lives
                    </Text>
                    <Text className="font-pixel_regular text-xs text-center mb-2" style={{ color: theme.textMuted }}>
                      Please wait for the lives refill
                    </Text>
                    <Text className="font-terminal text-3xl text-warning">
                      {refillCountdown}
                    </Text>
                  </>
                ) : isHourLimitReached ? (
                  <>
                    <Text className="font-arcade leading-7 text-sm text-destructive text-center mb-3">
                      Hourly Limit Reached
                    </Text>
                    <Text className="font-pixel_regular text-xs text-center mb-2" style={{ color: theme.textMuted }}>
                      Please wait for the hourly reset
                    </Text>
                    <Text className="font-terminal text-3xl text-warning">
                      {hourlyCountdown}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="font-arcade text-sm mb-4" style={{ color: avatar.color }}>
                      Ready to play?
                    </Text>
                    <TouchableOpacity
                      onPress={handleStartGame}
                      disabled={isSessionLoading}
                      className="px-6 py-2.5 rounded border"
                      style={{ backgroundColor: avatar.color, borderColor: avatar.color }}
                    >
                      {isSessionLoading ? (
                        <ActivityIndicator size="small" color={theme.bg} />
                      ) : (
                        <Text className="font-pixel_bold text-sm" style={{ color: theme.bg }}>
                          START GAME
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <View className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
              <View 
                className="border border-destructive p-5 rounded-lg items-center w-[80%]"
                style={{ backgroundColor: theme.canvasBg }}
              >
                <Text className="font-arcade text-sm text-destructive mb-2">
                  GAME OVER
                </Text>
                <Text className="font-pixel_bold text-base text-accent mb-4">
                  Score: {score}
                </Text>
                
                {isValidating ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color="#00ff00" />
                    <Text className="font-pixel_regular text-xs" style={{ color: avatar.color }}>
                      Syncing score...
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={resetGame}
                    className="px-5 py-2 rounded"
                    style={{ backgroundColor: avatar.color }}
                  >
                    <Text className="font-pixel_bold text-xs" style={{ color: theme.bg }}>
                      TRY AGAIN
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Paused Overlay */}
          {isPaused && !isGameOver && (
            <View className="absolute inset-0 bg-black/75 flex items-center justify-center z-10">
              <Text className="font-arcade text-lg text-warning">PAUSED</Text>
            </View>
          )}

          {/* Custom Pixel Grid and Game Elements */}
          <View className="flex-1">
            {/* Grid Line render */}
            {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
              <View
                key={`h-${i}`}
                className="absolute w-full"
                style={{
                  top: i * CELL_SIZE,
                  height: 1,
                  backgroundColor: theme.gridLine,
                }}
              />
            ))}
            {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
              <View
                key={`v-${i}`}
                className="absolute h-full"
                style={{
                  left: i * CELL_SIZE,
                  width: 1,
                  backgroundColor: theme.gridLine,
                }}
              />
            ))}

            {/* Snake segments rendering */}
            {snake.map((segment, index) => {
              const baseSizeRatio = avatar.size / 100;
              const segmentSize = Math.max(4, Math.floor((CELL_SIZE - 2) * baseSizeRatio));
              const segmentOffset = (CELL_SIZE - segmentSize) / 2;
              const glowOpacity = avatar.glow / 100;
              const glowRadius = Math.max(2, Math.floor(glowOpacity * 5));

              return (
                <View
                  key={`snake-${index}`}
                  style={{
                    position: 'absolute',
                    left: segment.x * CELL_SIZE + segmentOffset,
                    top: segment.y * CELL_SIZE + segmentOffset,
                    width: segmentSize,
                    height: segmentSize,
                    borderRadius: index === 0 ? 3 : 1,
                    backgroundColor: avatar.color,
                    opacity: index === 0 ? 1 : 0.8,
                    shadowColor: avatar.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: glowOpacity,
                    shadowRadius: glowRadius,
                  }}
                />
              );
            })}

            {/* Food item rendering */}
            <View
              className="bg-accent"
              style={{
                position: 'absolute',
                left: food.x * CELL_SIZE + 1,
                top: food.y * CELL_SIZE + 1,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                borderRadius: 999,
                shadowColor: '#00FF00',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 4,
              }}
            />
          </View>
        </View>

        {/* Controls & Actions Container */}
        <View className="items-center w-full mt-2">
          {/* Toggle Mode / Gameplay Actions Row */}
          <View className="flex-row justify-center items-center w-full mb-2 px-6">
            {!isGameStarted || isGameOver ? (
              /* Control Mode Toggle */
              <View className="flex-row gap-2 justify-center items-center">
                <TouchableOpacity
                  onPress={() => setControlMode('swipe')}
                  className="px-3 py-1.5 rounded-lg border"
                  style={{
                    backgroundColor: controlMode === 'swipe' ? avatar.color : '#2d3356',
                    borderColor: controlMode === 'swipe' ? avatar.color : 'rgba(128,128,128,0.2)',
                  }}
                >
                  <Text 
                    className="font-pixel_semibold text-[10px]"
                    style={{ color: controlMode === 'swipe' ? theme.bg : '#FFFFFF' }}
                  >
                    Swipe Mode
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setControlMode('buttons')}
                  className="px-3 py-1.5 rounded-lg border"
                  style={{
                    backgroundColor: controlMode === 'buttons' ? avatar.color : '#2d3356',
                    borderColor: controlMode === 'buttons' ? avatar.color : 'rgba(128,128,128,0.2)',
                  }}
                >
                  <Text 
                    className="font-pixel_semibold text-[10px]"
                    style={{ color: controlMode === 'buttons' ? theme.bg : '#FFFFFF' }}
                  >
                    Button Pad
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Gameplay Actions */
              <View className="flex-row gap-3 flex-1 justify-center items-center">
                <TouchableOpacity
                  onPress={togglePause}
                  className="flex-1 bg-grey-200 border border-grey/30 py-2 rounded-xl items-center justify-center"
                >
                  <Text className="font-pixel_bold text-white text-xs">
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={resetGame}
                  className="flex-1 bg-destructive/10 border border-red-500/50 py-2 rounded-xl items-center justify-center"
                >
                  <Text className="font-pixel_bold text-red-500 text-xs">RESET</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
 
          {/* Tactile Button Pad */}
          {controlMode === 'buttons' ? (
            <View className="items-center justify-center gap-2">
              {/* UP */}
              <TouchableOpacity
                onPress={() => changeDirection('UP')}
                className="w-16 h-16 rounded-full items-center justify-center border-2"
                style={{
                  backgroundColor: theme.glow,
                  borderColor: avatar.color,
                }}
              >
                <Ionicons name="chevron-up" size={28} color={avatar.color} />
              </TouchableOpacity>
              
              {/* LEFT / spacer / RIGHT */}
              <View className="flex-row gap-8 justify-center items-center">
                <TouchableOpacity
                  onPress={() => changeDirection('LEFT')}
                  className="w-16 h-16 rounded-full items-center justify-center border-2"
                  style={{
                    backgroundColor: theme.glow,
                    borderColor: avatar.color,
                  }}
                >
                  <Ionicons name="chevron-back" size={28} color={avatar.color} />
                </TouchableOpacity>
                
                <View className="w-16 h-16" />
                
                <TouchableOpacity
                  onPress={() => changeDirection('RIGHT')}
                  className="w-16 h-16 rounded-full items-center justify-center border-2"
                  style={{
                    backgroundColor: theme.glow,
                    borderColor: avatar.color,
                  }}
                >
                  <Ionicons name="chevron-forward" size={28} color={avatar.color} />
                </TouchableOpacity>
              </View>
 
              {/* DOWN */}
              <TouchableOpacity
                onPress={() => changeDirection('DOWN')}
                className="w-16 h-16 rounded-full items-center justify-center border-2"
                style={{
                  backgroundColor: theme.glow,
                  borderColor: avatar.color,
                }}
              >
                <Ionicons name="chevron-down" size={28} color={avatar.color} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Swipe instruction helper to keep layout stable and inform user */
            <View className="h-[208px] items-center justify-center w-full">
              <Text className="font-pixel_regular text-[10px] text-center uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Swipe anywhere on canvas to steer
              </Text>
            </View>
          )}
        </View>
 
      {/* Share Modal Dialog */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View 
            className="border rounded-2xl p-6 w-full max-w-sm"
            style={{ backgroundColor: theme.bg, borderColor: avatar.color }}
          >
            <Text className="font-arcade text-base text-accent text-center mb-2">
              NEW RECORD!
            </Text>
            <Text className="font-arcade text-3xl text-warning text-center mb-4">
              {score}
            </Text>
            <Text className="font-pixel_regular text-xs text-center mb-6" style={{ color: theme.textMuted }}>
              Share your retro credentials and challenge fellow agents.
            </Text>
 
            <TouchableOpacity
              onPress={() => handleShare('native')}
              className="py-3.5 rounded-xl mb-3"
              style={{ backgroundColor: avatar.color }}
            >
              <Text className="font-pixel_bold text-center text-xs" style={{ color: theme.bg }}>
                SHARE PERFORMANCE
              </Text>
            </TouchableOpacity>
 
            <TouchableOpacity
              onPress={() => handleShare('twitter')}
              className="py-3.5 rounded-xl mb-2"
              style={{ backgroundColor: '#1DA1F2' }}
            >
              <Text className="font-pixel_bold text-white text-center text-xs">
                SHARE ON X
              </Text>
            </TouchableOpacity>
 
            <TouchableOpacity
              onPress={() => setShowShareModal(false)}
              className="py-3 rounded-xl border mt-4"
              style={{ backgroundColor: theme.canvasBg, borderColor: `${avatar.color}30` }}
            >
              <Text className="font-pixel_bold text-center text-xs" style={{ color: avatar.color }}>
                CLOSE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        </View>
      </SafeAreaView>
    </View>
  );
}
