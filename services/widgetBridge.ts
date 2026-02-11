import { Note } from '@/constants/types';
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

// App Group ID for iOS
const APP_GROUP = 'group.com.dtechoracle.lovii';

// Shared Preferences name for Android
const ANDROID_PREFS = 'LoviiWidgetData';

// Simplified to Object Literal to avoid Class Instantiation issues
export const widgetBridge = {
    async updateWidgetData(note: Note): Promise<void> {
        try {
            const widgetData = {
                type: note.type,
                content: note.content,
                timestamp: note.timestamp,
                color: note.color || '#FFFFFF',
                images: note.images || [],
            };

            const jsonString = JSON.stringify(widgetData);

            if (Platform.OS === 'ios') {
                await SharedGroupPreferences.setItem(
                    'latestNote',
                    jsonString,
                    APP_GROUP
                );
            } else {
                // Android
                await SharedGroupPreferences.setItem(
                    'latestNote',
                    jsonString,
                    ANDROID_PREFS
                );
            }

            console.log('Widget data updated successfully');
        } catch (error) {
            // Silently fail if native module is missing (e.g. Expo Go) or error occures
        }
    }
};
