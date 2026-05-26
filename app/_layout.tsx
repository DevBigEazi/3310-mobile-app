import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
