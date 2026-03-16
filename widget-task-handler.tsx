import { StorageService } from '@/services/storage';
import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { AndroidWidget } from './components/AndroidWidget';
import { calculateStreak } from './services/streak';

const WIDGET_NAME = 'LoviiWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    const widgetInfo = props.widgetInfo;
    const widgetName = widgetInfo.widgetName;

    if (widgetName === WIDGET_NAME) {
        try {
            if (props.clickAction === 'TOGGLE_TASK') {
                const taskId = props.clickActionData?.taskId as string;
                if (taskId) {
                    await StorageService.togglePartnerTask(taskId);
                }
            }

            // Fetch latest partner note
            const latestNote = await StorageService.getLatestPartnerNote();

            // Calculate BIDIRECTIONAL streak (both must send for day to count)
            const partnerNotes = await StorageService.getPartnerNotes();
            const myNotes = await StorageService.getMyHistory();
            const restoredDays = await StorageService.getRestoredStreakDays();
            const streak = calculateStreak(myNotes || [], partnerNotes || [], restoredDays);

            if (!latestNote) {
                props.renderWidget(
                    <AndroidWidget
                        content=""
                        type="text"
                        timestamp={Date.now()}
                        hasPartnerNote={false}
                    />
                );
                return;
            }

            // Get partner name & theme
            const profile = await StorageService.getProfile();
            const partnerName = profile?.partnerName || 'Partner';

            // Determine dark mode
            const themeMode = profile?.themeMode || 'auto';
            let isDark = themeMode === 'dark';

            if (themeMode === 'auto') {
                try {
                    const Appearance = require('react-native').Appearance;
                    const sysMode = Appearance ? Appearance.getColorScheme() : 'light';
                    isDark = sysMode === 'dark';
                } catch (e) {
                    isDark = false;
                }
            }

            props.renderWidget(
                <AndroidWidget
                    content={latestNote.content}
                    type={latestNote.type}
                    timestamp={latestNote.timestamp}
                    color={latestNote.color}
                    streak={streak}
                    hasPartnerNote={true}
                    partnerName={partnerName}
                    isDark={isDark}
                    images={latestNote.images}
                    musicTrack={latestNote.musicTrack}
                    tasks={latestNote.tasks}
                    fontFamily={latestNote.fontFamily}
                    fontWeight={latestNote.fontWeight}
                    fontStyle={latestNote.fontStyle}
                    widgetWidth={widgetInfo.width}
                    widgetHeight={widgetInfo.height}
                />
            );
        } catch (error) {
            console.error('Widget Task Handler Failed:', error);
            // Fallback to avoid empty/broken widget
            props.renderWidget(
                <AndroidWidget
                    content="Widget Error"
                    type="text"
                    timestamp={Date.now()}
                    hasPartnerNote={false}
                />
            );
        }
    }
}
