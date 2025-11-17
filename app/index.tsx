import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
     className="flex justify-center items-center h-screen"
    >
      <Text className="text-blue-600 font-pixel_medium">Welcome to snake</Text>
      <Link href="/(tabs)/game">Game</Link>
    </View>
  );
}
