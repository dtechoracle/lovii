import { Note, StorageService } from '@/services/storage';
import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { AndroidWidget } from './components/AndroidWidget';

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
            // themeMode is 'light' | 'dark' | 'auto'
            const isDark = profile?.themeMode === 'dark';
            // Note: themePreference is usually a palette name like 'ocean', not 'dark'.
            // But if we want to support 'system' (auto) we might default to light in background 
            // unless we store the last known system state. 
            // For now, let's use the explicit 'dark' mode setting if available.
            // Actually, let's check if the palette itself implies dark? No.
            // Let's rely on themeMode.

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
                    textDecorationLine={latestNote.textDecorationLine}
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

/**
 * Snapchat-style streak: BOTH users must have sent at least one note on the same
 * calendar day for that day to count towards the streak. If either side misses a
 * day, the streak resets to 0 and can only start again when both send on the same day.
 * restoredDays: days where the streak was restored via 5-point purchase — count as mutual-send days.
 */
function calculateStreak(myNotes: Note[], partnerNotes: Note[], restoredDays: number[] = []): number {
    if (!myNotes.length && !partnerNotes.length && !restoredDays.length) return 0;

    const toMidnight = (ts: number) => {
        const d = new Date(ts);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    };

    // Build sets of unique days each side sent
    const myDays = new Set(myNotes.map(n => toMidnight(n.timestamp)));
    const partnerDays = new Set(partnerNotes.map(n => toMidnight(n.timestamp)));

    // Restored days count as "both sent" for that calendar day
    restoredDays.forEach(day => {
        myDays.add(day);
        partnerDays.add(day);
    });

    // Days where BOTH sent (or streak was restored)
    const bothSentDays = Array.from(myDays)
        .filter(day => partnerDays.has(day))
        .sort((a, b) => b - a); // Most recent first

    if (bothSentDays.length === 0) return 0;

    const today = toMidnight(Date.now());
    const oneDay = 24 * 60 * 60 * 1000;

    // Streak only alive if the most recent mutual day is today or yesterday
    if (bothSentDays[0] < today - oneDay) return 0;

    // Count consecutive days backwards from the most recent mutual day
    let streak = 1;
    let expectedDay = bothSentDays[0] - oneDay;

    for (let i = 1; i < bothSentDays.length; i++) {
        if (bothSentDays[i] === expectedDay) {
            streak++;
            expectedDay -= oneDay;
        } else {
            break;
        }
    }

    return streak;
}
