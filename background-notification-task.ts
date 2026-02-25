import { StorageService } from '@/services/storage';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
    if (error) {
        console.error("Background notification task failed", error);
        return;
    }
    if (data) {
        const { notification } = data as any;
        const payload = notification?.data;
        if (payload?.type === 'WIDGET_UPDATE' || payload?.type === 'NOTE_RECEIVED') {
            console.log("Background Notification Received: Updating Widget");
            if (payload?.note) {
                await StorageService.processIncomingPartnerNote(payload.note);
            } else {
                await StorageService.updateWidget();
            }
        }
    }
});
