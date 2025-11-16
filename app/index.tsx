import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
     className="flex justify-center items-center h-screen"
    >
      <Text className="text-blue-600">Welcome to snake</Text>
      <Link href="/onboarding">Onboarding</Link>
    </View>
  );
}
