import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  
  const [loaded, error] = useFonts({
    'PressStart2P-Regular': require('../assets/fonts/Press_Start_2P/PressStart2P-Regular.ttf'),
    'VT323-Regular': require('../assets/fonts/VT323/VT323-Regular.ttf'),
    'PixelifySans-Regular': require('../assets/fonts/Pixelify_Sans/PixelifySans-Regular.ttf'),
    'PixelifySans-Medium': require('../assets/fonts/Pixelify_Sans/PixelifySans-Medium.ttf'),
    'PixelifySans-SemiBold': require('../assets/fonts/Pixelify_Sans/PixelifySans-SemiBold.ttf'),
    'PixelifySans-Bold': require('../assets/fonts/Pixelify_Sans/PixelifySans-Bold.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins/Poppins-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
