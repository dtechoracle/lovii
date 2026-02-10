import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="connect" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="editor" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="todo" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="collage" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="history" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
