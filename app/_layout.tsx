import { Stack } from "expo-router";
import "./global.css";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [loaded] = useFonts({
    // Poppins fonts
    "Poppins-Regular": require("../assets/fonts/Poppins/Poppins-Regular.ttf"),
    
    // Press Start 2P fonts
    "PressStart2P-Regular": require("../assets/fonts/Press_Start_2P/PressStart2P-Regular.ttf"),
   
    // VT323 fonts
    "VT323-Regular": require("../assets/fonts/VT323/VT323-Regular.ttf"),

    // Pixelify Sans fonts
    "PixelifySans-Regular": require("../assets/fonts/Pixelify_Sans/PixelifySans-Regular.ttf"),
    "PixelifySans-Medium": require("../assets/fonts/Pixelify_Sans/PixelifySans-Medium.ttf"),
    "PixelifySans-SemiBold": require("../assets/fonts/Pixelify_Sans/PixelifySans-SemiBold.ttf"),
    "PixelifySans-Bold": require("../assets/fonts/Pixelify_Sans/PixelifySans-Bold.ttf"),
  });

   if (!loaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
