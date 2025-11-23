import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Modal,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GRID_SIZE = 20;
const CELL_SIZE = 15;
const INITIAL_SPEED = 150;

interface GameState {
  snake: Array<{ x: number; y: number }>;
  food: { x: number; y: number };
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
  isGameStarted: boolean;
}

interface SnakeGameProps {
  currentHighScore: number;
  onValidateScore: (score: number, gameSessionId: string) => Promise<boolean>;
  isValidating?: boolean;
  canPlay?: boolean;
  gamesPlayedInCurrentHour?: number;
  maxGamesPerHour?: number;
  timeRemaining?: string;
}

export default function SnakeGame({
  currentHighScore,
  onValidateScore,
  isValidating = false,
  canPlay = true,
  gamesPlayedInCurrentHour = 0,
  maxGamesPerHour = 5,
  timeRemaining,
}: SnakeGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: "RIGHT",
    score: 0,
    isGameOver: false,
    isPaused: false,
    isGameStarted: false,
  });

  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const directionRef = useRef("RIGHT");
  const [showShareModal, setShowShareModal] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [controlMode, setControlMode] = useState<"buttons" | "swipe">("swipe");
  const gameSessionIdRef = useRef<string>("");
  const scoreSubmittedRef = useRef<boolean>(false);

  const generateFood = useCallback((snake: Array<{ x: number; y: number }>) => {
    let newFood: any;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      snake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    return newFood;
  }, []);

  const resetGame = () => {
    const initialState: GameState = {
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 15 },
      direction: "RIGHT",
      score: 0,
      isGameOver: false,
      isPaused: false,
      isGameStarted: false,
    };
    setGameState(initialState);
    directionRef.current = "RIGHT";
    setSpeed(INITIAL_SPEED);
    scoreSubmittedRef.current = false;
  };

  const startGame = () => {
    if (!canPlay) return;

    // Generate unique game session ID
    gameSessionIdRef.current = `session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    scoreSubmittedRef.current = false;
    setGameState((prev) => ({
      ...prev,
      isGameStarted: true,
    }));
  };

  const togglePause = () => {
    if (!gameState.isGameOver && gameState.isGameStarted) {
      setGameState((prev) => ({
        ...prev,
        isPaused: !prev.isPaused,
      }));
    }
  };

  useEffect(() => {
    if (!gameState.isGameStarted || gameState.isPaused || gameState.isGameOver)
      return;

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        const head = prev.snake[0];
        let newHead = { ...head };

        switch (directionRef.current) {
          case "UP":
            newHead.y -= 1;
            break;
          case "DOWN":
            newHead.y += 1;
            break;
          case "LEFT":
            newHead.x -= 1;
            break;
          case "RIGHT":
            newHead.x += 1;
            break;
        }

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          return { ...prev, isGameOver: true };
        }

        if (
          prev.snake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y
          )
        ) {
          return { ...prev, isGameOver: true };
        }

        const newSnake = [newHead, ...prev.snake];
        let newFood = prev.food;
        let newScore = prev.score;

        if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
          newScore += 300;
          newFood = generateFood(newSnake);
          setSpeed((s) => Math.max(50, s - 2));
        } else {
          newSnake.pop();
        }

        return {
          ...prev,
          snake: newSnake,
          food: newFood,
          score: newScore,
        };
      });
    }, speed);

    return () => clearInterval(gameLoop);
  }, [
    gameState.isGameStarted,
    gameState.isPaused,
    gameState.isGameOver,
    speed,
    generateFood,
  ]);

  // Handle game over and score validation
  useEffect(() => {
    if (
      gameState.isGameOver &&
      gameState.score > 0 &&
      !isValidating &&
      !scoreSubmittedRef.current
    ) {
      scoreSubmittedRef.current = true;
      const submitScore = async () => {
        const isValid = await onValidateScore(
          gameState.score,
          gameSessionIdRef.current
        );
        if (isValid) {
          setShowShareModal(true);
        }
      };
      submitScore();
    }
  }, [gameState.isGameOver, gameState.score, isValidating, onValidateScore]);

  const handleShare = async (platform: string) => {
    const text = `Just scored ${gameState.score} points on @play_3310! 🐍 Can you beat me?`;
    try {
      if (platform === "native") {
        await Share.share({ message: text });
      } else {
        const urls: Record<string, string> = {
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
          whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
          telegram: `https://t.me/share/url?text=${encodeURIComponent(text)}`,
        };
        if (urls[platform]) {
          console.log("Share link:", urls[platform]);
        }
      }
    } catch (error) {
      console.error("Share error:", error);
    }
    setShowShareModal(false);
  };

  const handleDirectionButton = (
    direction: "UP" | "DOWN" | "LEFT" | "RIGHT"
  ) => {
    if (gameState.isGameOver || gameState.isPaused || !gameState.isGameStarted)
      return;

    const opposites: Record<string, string> = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    };

    if (opposites[directionRef.current] !== direction) {
      directionRef.current = direction;
      setGameState((prev) => ({ ...prev, direction }));
    }
  };

  const handleTouchStart = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    touchStartRef.current = { x: locationX, y: locationY };
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const startX = touchStartRef.current?.x;
    const startY = touchStartRef.current?.y;

    if (startX !== undefined && startY !== undefined) {
      const deltaX = locationX - startX;
      const deltaY = locationY - startY;
      const threshold = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          handleDirectionButton("RIGHT");
        } else {
          handleDirectionButton("LEFT");
        }
      } else if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          handleDirectionButton("DOWN");
        } else {
          handleDirectionButton("UP");
        }
      }
    }
  };

  const canvasWidth = GRID_SIZE * CELL_SIZE;
  const canvasHeight = GRID_SIZE * CELL_SIZE;

  return (
    <SafeAreaView className="flex-1 bg-primary pt-2">
      {/* Header */}
      <View className="mb-2 items-center">
        <Text className="font-arcade text-accent mb-2 text-lg">
          PLAY & COMPETE
        </Text>
        <Text className="font-terminal text-grey-100 text-lg">
          Reach 500 points to qualify for weekly rewards.
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-4">
        {/* Score Display */}
        <View className="flex-row justify-between w-full mb-6 px-4">
          <View>
            <Text className="font-pixel_regular text-xs text-secondary mb-1">
              SCORE
            </Text>
            <Text className="font-arcade text-2xl text-accent">
              {gameState.score}
            </Text>
          </View>
          <View>
            <Text className="font-pixel_regular text-xs text-secondary mb-1">
              THIS WEEK
            </Text>
            <Text className="font-arcade text-2xl text-accent">
              {currentHighScore}
            </Text>
          </View>
          <View>
            <Text className="font-pixel_regular text-xs text-secondary mb-1">
              GAMES/HOUR
            </Text>
            <Text
              className={`font-arcade text-2xl ${gamesPlayedInCurrentHour >= maxGamesPerHour ? "text-destructive" : "text-accent"}`}
            >
              {gamesPlayedInCurrentHour}/{maxGamesPerHour}
            </Text>
          </View>
        </View>

        {/* Game Canvas */}
        <View
          onTouchStart={
            controlMode === "swipe" && gameState.isGameStarted
              ? handleTouchStart
              : undefined
          }
          onTouchEnd={
            controlMode === "swipe" && gameState.isGameStarted
              ? handleTouchEnd
              : undefined
          }
          className="bg-primary border-2 border-secondary rounded-lg overflow-hidden mb-6"
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* Game Not Started Overlay */}
          {!gameState.isGameStarted && (
            <View className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <View className="bg-primary border-2 border-secondary p-6 rounded-lg items-center">
                {!canPlay ? (
                  <>
                    <Text className="font-arcade leading-8 text-lg text-destructive text-center mb-4">
                      Hourly Limit Reached
                    </Text>
                    <Text className="font-pixel_regular text-sm text-grey-100 text-center mb-2">
                      Please wait for the hourly reset
                    </Text>
                    <Text className="font-arcade text-4xl text-destructive">
                      {timeRemaining}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="font-arcade text-xl text-accent mb-4">
                      Ready to play?
                    </Text>
                    <TouchableOpacity
                      onPress={startGame}
                      className="bg-secondary px-6 py-3 rounded"
                    >
                      <Text className="font-pixel_bold text-primary text-lg">
                        START GAME
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Game Over Overlay */}
          {gameState.isGameOver && (
            <View className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <View className="bg-primary border-2 border-destructive p-6 rounded-lg items-center">
                <Text className="font-arcade text-xl text-destructive mb-2">
                  GAME OVER
                </Text>
                <Text className="font-pixel_bold text-lg text-accent mb-4">
                  Score: {gameState.score}
                </Text>
                {isValidating && (
                  <>
                    <ActivityIndicator size="large" color="#00ff00" />
                    <Text className="font-pixel_regular text-sm text-secondary mt-2">
                      Validating score...
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Paused Overlay */}
          {gameState.isPaused && !gameState.isGameOver && (
            <View className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <Text className="font-arcade text-2xl text-warning">PAUSED</Text>
            </View>
          )}

          {/* Grid and Game Elements */}
          <View className="flex-1 bg-primary">
            {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
              <View
                key={`h-${i}`}
                className="absolute w-full"
                style={{
                  top: i * CELL_SIZE,
                  height: 1,
                  backgroundColor: "#1a1f3a",
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
                  backgroundColor: "#1a1f3a",
                }}
              />
            ))}

            {/* Snake */}
            {gameState.snake.map((segment, index) => (
              <View
                key={`snake-${index}`}
                className={index === 0 ? "bg-secondary" : "bg-secondary/80"}
                style={{
                  position: "absolute",
                  left: segment.x * CELL_SIZE + 1,
                  top: segment.y * CELL_SIZE + 1,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                }}
              />
            ))}

            {/* Food */}
            <View
              className="bg-accent"
              style={{
                position: "absolute",
                left: gameState.food.x * CELL_SIZE + 1,
                top: gameState.food.y * CELL_SIZE + 1,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />
          </View>
        </View>

        {/* Control Mode Toggle */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={() => setControlMode("swipe")}
            className={`px-4 py-2 rounded ${
              controlMode === "swipe" ? "bg-secondary" : "bg-grey-200"
            }`}
          >
            <Text className="font-pixel_regular text-primary">Swipe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setControlMode("buttons")}
            className={`px-4 py-2 rounded ${
              controlMode === "buttons" ? "bg-secondary" : "bg-grey-200"
            }`}
          >
            <Text className="font-pixel_regular text-primary">Buttons</Text>
          </TouchableOpacity>
        </View>

        {/* Control Buttons */}
        {controlMode === "buttons" && gameState.isGameStarted && (
          <View className="mb-6 items-center gap-2">
            <TouchableOpacity
              onPress={() => handleDirectionButton("UP")}
              disabled={gameState.isGameOver}
              className="bg-secondary w-14 h-14 rounded items-center justify-center"
            >
              <Text className="text-primary font-pixel_bold text-lg">↑</Text>
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleDirectionButton("LEFT")}
                disabled={gameState.isGameOver}
                className="bg-secondary w-14 h-14 rounded items-center justify-center"
              >
                <Text className="text-primary font-pixel_bold text-lg">←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDirectionButton("DOWN")}
                disabled={gameState.isGameOver}
                className="bg-secondary w-14 h-14 rounded items-center justify-center"
              >
                <Text className="text-primary font-pixel_bold text-lg">↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDirectionButton("RIGHT")}
                disabled={gameState.isGameOver}
                className="bg-secondary w-14 h-14 rounded items-center justify-center"
              >
                <Text className="text-primary font-pixel_bold text-lg">→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Game Controls */}
        <View className="flex-row gap-3 mb-6">
          {gameState.isGameStarted && (
            <>
              <TouchableOpacity
                onPress={togglePause}
                disabled={gameState.isGameOver}
                className="flex-1 bg-secondary px-4 py-3 rounded items-center"
              >
                <Text className="font-pixel_bold text-primary">
                  {gameState.isPaused ? "PLAY" : "PAUSE"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resetGame}
                className="flex-1 bg-warning px-4 py-3 rounded items-center"
              >
                <Text className="font-pixel_bold text-primary">RESET</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-primary border-2 border-secondary rounded-lg p-6 w-full max-w-sm">
            <Text className="font-arcade text-lg text-accent text-center mb-2">
              New High Score!
            </Text>
            <Text className="font-arcade text-2xl text-warning text-center mb-4">
              {gameState.score}
            </Text>
            <Text className="font-pixel_regular text-sm text-grey-100 text-center mb-6">
              Share your score and challenge your friends!
            </Text>

            <TouchableOpacity
              onPress={() => handleShare("native")}
              className="bg-secondary px-4 py-3 rounded mb-2"
            >
              <Text className="font-pixel_bold text-primary text-center">
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleShare("twitter")}
              className="bg-blue-400 px-4 py-3 rounded mb-2"
            >
              <Text className="font-pixel_bold text-white text-center">
                Share on X
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleShare("whatsapp")}
              className="bg-green-500 px-4 py-3 rounded mb-2"
            >
              <Text className="font-pixel_bold text-white text-center">
                Share on WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleShare("telegram")}
              className="bg-blue-500 px-4 py-3 rounded mb-4"
            >
              <Text className="font-pixel_bold text-white text-center">
                Share on Telegram
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowShareModal(false)}
              className="bg-grey px-4 py-3 rounded"
            >
              <Text className="font-pixel_bold text-white text-center">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
