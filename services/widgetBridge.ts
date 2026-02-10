import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { Note } from './storage';

// App Group ID for iOS
// MUST match the group ID in your entitlements and Swift code
const APP_GROUP = 'group.com.dtechoracle.lovii';

// Shared Preferences name for Android
// MUST match the name used in your Kotlin code
const ANDROID_PREFS = 'LoviiWidgetData';

interface WidgetBridgeInterface {
    updateWidgetData(note: Note): Promise<void>;
}

class WidgetBridgeService implements WidgetBridgeInterface {

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

            // Note: SharedGroupPreferences doesn't automatically reload widgets.
            // Start of creating a mechanism to reload widgets if possible. 
            // react-native-widget-extension usually manages the reload via a different method or
            // purely relies on the timeline policy (every 15 min).
            // For now, updating the data is the critical part.

            console.log('Widget data updated successfully');
        } catch (error) {
            console.error('Failed to update widget data:', error);
        }
    }
}

export const widgetBridge = new WidgetBridgeService();
