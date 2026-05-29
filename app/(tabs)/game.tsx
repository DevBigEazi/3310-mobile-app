import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameScore } from '../../hooks/useGameScore';
import SnakeGame from '../../components/SnakeGame';

export default function GameScreen(): React.JSX.Element {
  const gameScore = useGameScore();

  return (
    <SnakeGame {...gameScore} />
  );
}

