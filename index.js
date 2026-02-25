import * as Notifications from 'expo-notifications';
import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import './background-notification-task'; // Define the task
import { widgetTaskHandler } from './widget-task-handler';

// Define background notification task
Notifications.registerTaskAsync('BACKGROUND_NOTIFICATION_TASK');

registerWidgetTaskHandler(widgetTaskHandler);
