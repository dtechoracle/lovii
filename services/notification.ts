import { StorageService } from '@/services/storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
});

export const NotificationService = {
    async registerForPushNotificationsAsync(): Promise<string | undefined> {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
            console.log('Project ID not found');
        }

        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            console.log('Push Token:', pushTokenString);
            return pushTokenString;
        } catch (e: unknown) {
            console.error('Error getting push token:', e);
            return undefined;
        }
    },

    setupNotificationListeners() {
        // Listener for incoming notifications handled in the foreground
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            const data = notification.request.content.data;
            console.log('[NotificationService] Notification received:', data);

            if (data?.type === 'WIDGET_UPDATE') {
                console.log('[NotificationService] Widget update trigger received');
                StorageService.updateWidget();

                // Also refresh partner notes in app if open
                StorageService.getPartnerNotes().then((notes) => {
                    // This just refreshes the cache, the view might need context update
                    // But StorageService.subscribeToPartnerNotes in layout handles the polling anyway 
                    // so we might just want to trigger a manual check there?
                    // Actually StorageService.updateWidget calls getPartnerNotes which updates local cache
                });
            }
        });

        // Listener for when user taps on notification
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('[NotificationService] Notification tapped:', response);
            const data = response.notification.request.content.data;

            if (data?.url) {
                // linking logic if needed
            }
        });

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    },
};
