import { Note } from '@/constants/types';

/**
 * Snapchat-style streak: BOTH users must have sent at least one note on the same
 * calendar day for that day to count towards the streak. If either side misses a
 * day, the streak resets to 0 and can only start again when both send on the same day.
 * 
 * @param myNotes Array of notes sent by the local user
 * @param partnerNotes Array of notes received from the partner
 * @param restoredDays Array of timestamps (midnight) for days where streak was restored
 * @returns Current streak count
 */
export function calculateStreak(myNotes: Note[], partnerNotes: Note[], restoredDays: number[] = []): number {
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
