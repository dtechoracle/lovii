import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationService } from '@/services/notification';
import { StorageService } from '@/services/storage';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Setup Notifications and Partner Notes
  useEffect(() => {
    console.log('[RootLayout] Starting services...');

    // Force immediate widget update on app start
    StorageService.updateWidget();

    const cleanupNotifications = NotificationService.setupNotificationListeners();

    NotificationService.registerForPushNotificationsAsync().then(token => {
      if (token) {
        StorageService.savePushToken(token);
      }
    });

    const subscription = StorageService.subscribeToPartnerNotes((note) => {
      console.log('[RootLayout] New partner note received:', note.type);
    });

    return () => {
      subscription.unsubscribe();
      cleanupNotifications();
    };
  }, []);

  // Update widget when system theme changes
  useEffect(() => {
    StorageService.updateWidget();
  }, [colorScheme]);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="connect" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="editor" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
              <Stack.Screen name="todo" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="collage" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="history" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="pricing" options={{ headerShown: false, presentation: 'modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </NavThemeProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
