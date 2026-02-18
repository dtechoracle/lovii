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
            // Fetch latest partner note
            const latestNote = await StorageService.getLatestPartnerNote();

            // Calculate Streak
            const allNotes = await StorageService.getPartnerNotes();
            const streak = calculateStreak(allNotes || []);

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

            // Get partner name
            const profile = await StorageService.getProfile();
            const partnerName = profile?.partnerName || 'Partner';

            props.renderWidget(
                <AndroidWidget
                    content={latestNote.content}
                    type={latestNote.type}
                    timestamp={latestNote.timestamp}
                    color={latestNote.color}
                    streak={streak}
                    hasPartnerNote={true}
                    partnerName={partnerName}
                />
            );
        } catch (error) {
            console.error('Widget Task Handler Failed:', error);
            // Fallback to avoid empty/broken widget if possible, or just log
        }
    }
}

function calculateStreak(notes: Note[]): number {
    if (!notes || notes.length === 0) return 0;

    // Sort descending
    const sorted = [...notes].sort((a, b) => b.timestamp - a.timestamp);
    let streak = 0;

    // Check if posted today
    const now = new Date();
    // Reset time to midnight for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    // Get unique days (timestamps at midnight)
    const uniqueDays = Array.from(new Set(sorted.map(n => {
        const d = new Date(n.timestamp);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }))).sort((a, b) => b - a); // Sort descending

    if (uniqueDays.length === 0) return 0;

    // Check if the most recent note is from today or yesterday
    // If last note was 2 days ago, streak is broken (0)
    if (uniqueDays[0] === today) {
        // Streak is alive, start checking from today
        streak = 1;
        let expectedDay = today - oneDay;

        for (let i = 1; i < uniqueDays.length; i++) {
            if (uniqueDays[i] === expectedDay) {
                streak++;
                expectedDay -= oneDay;
            } else {
                break;
            }
        }
    } else if (uniqueDays[0] === today - oneDay) {
        // Streak is alive but not incremented for today yet? 
        // Actually, if I posted yesterday, my streak is 1. If I post today, it becomes 2.
        // So we count backwards from yesterday.
        streak = 1;
        let expectedDay = (today - oneDay) - oneDay;

        for (let i = 1; i < uniqueDays.length; i++) {
            if (uniqueDays[i] === expectedDay) {
                streak++;
                expectedDay -= oneDay;
            } else {
                break;
            }
        }
    } else {
        // Streak broken
        return 0;
    }

    return streak;
}
