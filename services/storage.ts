import AsyncStorage from '@react-native-async-storage/async-storage';
import { widgetBridge } from './widgetBridge';

// API Base URL - In dev, likely localhost or dev server IP.
// user needs to configure this based on their environment.
// For now, we assume relative path works if using Expo Router API routes in same app?
// Actually, Expo API routes run on the server. If using Expo Go, we need full URL.
// We'll use a constant for now.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api';

export interface Note {
    id: string;
    type: 'text' | 'drawing' | 'collage';
    content: string;
    timestamp: number;
    color?: string;
    images?: string[];
    pinned?: boolean;
    bookmarked?: boolean;
}

export interface UserProfile {
    id: string;
    name: string;
    partnerCode: string;
    connectedPartnerId?: string;
    partnerName?: string;
    mood?: string;
    anniversary?: number;
}

export interface Task {
    id: string;
    text: string;
    completed: boolean;
}

const KEYS = {
    PROFILE_ID: 'lovii_profile_id',
    PROFILE_CODE: 'lovii_profile_code',
    PARTNER_ID: 'lovii_partner_id',
};

export const StorageService = {
    // ==================== Profile ====================

    async getProfile(): Promise<UserProfile | null> {
        try {
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            if (!profileId) return null;

            const res = await fetch(`${API_URL}/profile?id=${profileId}`);
            if (!res.ok) return null;

            const data = await res.json();

            // Sync local partner ID if found on server
            if (data.partnerId) {
                await AsyncStorage.setItem(KEYS.PARTNER_ID, data.partnerId);
            }

            return {
                id: data.id,
                name: data.name || 'User',
                partnerCode: data.partnerCode,
                connectedPartnerId: data.partnerId || undefined,
                partnerName: data.partnerName || undefined,
                anniversary: data.anniversary || undefined,
            };
        } catch (error) {
            console.error('getProfile error:', error);
            return null;
        }
    },

    async createProfile(): Promise<UserProfile> {
        const res = await fetch(`${API_URL}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'User' }),
        });

        if (!res.ok) throw new Error('Failed to create profile');
        const data = await res.json();

        const profile: UserProfile = {
            id: data.id,
            name: data.name || 'User',
            partnerCode: data.partnerCode,
        };

        await AsyncStorage.setItem(KEYS.PROFILE_ID, profile.id);
        await AsyncStorage.setItem(KEYS.PROFILE_CODE, profile.partnerCode);

        return profile;
    },

    async connectToPartner(partnerCode: string): Promise<boolean> {
        try {
            const myId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            if (!myId) return false;

            const res = await fetch(`${API_URL}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ myId, partnerCode }),
            });

            if (!res.ok) return false;

            const data = await res.json();
            if (data.success) {
                await AsyncStorage.setItem(KEYS.PARTNER_ID, data.partnerId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('connectToPartner error:', error);
            return false;
        }
    },

    // ==================== Notes ====================

    async saveMyNote(note: Note): Promise<void> {
        try {
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            if (!profileId) return;

            // Optimistic Update? Or just wait.
            // Let's wait for now.

            await fetch(`${API_URL}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileId,
                    type: note.type,
                    content: note.content,
                    color: note.color,
                    images: note.images,
                    timestamp: note.timestamp,
                    pinned: note.pinned,
                    bookmarked: note.bookmarked
                }),
            });

            // Update widget
            await widgetBridge.updateWidgetData(note);
        } catch (error) {
            console.error('saveMyNote error:', error);
        }
    },

    async getMyHistory(): Promise<Note[]> {
        try {
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            if (!profileId) return [];

            const res = await fetch(`${API_URL}/notes?profileId=${profileId}`);
            if (!res.ok) return [];

            const data = await res.json();
            return data.map((n: any) => ({
                id: n.id,
                type: n.type,
                content: n.content,
                timestamp: n.timestamp,
                color: n.color,
                images: n.images,
                pinned: n.pinned,
                bookmarked: n.bookmarked
            }));
        } catch (error) {
            console.error('getMyHistory error:', error);
            return [];
        }
    },

    async getPartnerNotes(): Promise<Note[]> {
        try {
            const partnerId = await AsyncStorage.getItem(KEYS.PARTNER_ID);
            // Verify partner connection from profile if local storage missing
            if (!partnerId) {
                const profile = await this.getProfile();
                if (!profile?.connectedPartnerId) return [];
            }

            // Prefer the stored one or the one we just fetched
            const pid = partnerId || (await this.getProfile())?.connectedPartnerId;
            if (!pid) return [];

            const res = await fetch(`${API_URL}/notes?profileId=${pid}`);
            if (!res.ok) return [];

            const data = await res.json();
            return data.map((n: any) => ({
                id: n.id,
                type: n.type,
                content: n.content,
                timestamp: n.timestamp,
                color: n.color,
                images: n.images,
                pinned: n.pinned,
                bookmarked: n.bookmarked
            }));
        } catch (error) {
            console.error('getPartnerNotes error:', error);
            return [];
        }
    },

    async updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
        try {
            await fetch(`${API_URL}/notes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: noteId, ...updates }),
            });
        } catch (error) {
            console.error('updateNote error:', error);
        }
    },

    async togglePin(noteId: string, currentPinned: boolean): Promise<void> {
        try {
            await this.updateNote(noteId, { pinned: !currentPinned });
        } catch (e) { console.error(e); }
    },

    async toggleBookmark(noteId: string, currentBookmarked: boolean): Promise<void> {
        try {
            await this.updateNote(noteId, { bookmarked: !currentBookmarked });
        } catch (e) { console.error(e); }
    },

    // ==================== Tasks ====================

    async getTasks(): Promise<Task[]> {
        try {
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            if (!profileId) return [];

            const res = await fetch(`${API_URL}/tasks?profileId=${profileId}`);
            if (!res.ok) return [];
            return await res.json();
        } catch (error) {
            console.error('getTasks error:', error);
            return [];
        }
    },

    async saveTasks(tasks: Task[]): Promise<void> {
        try {
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            if (!profileId) return;

            // Format for bulk api
            const payload = tasks.map(t => ({
                profileId,
                text: t.text,
                completed: t.completed
            }));

            await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            console.error('saveTasks error:', error);
        }
    },

    // ==================== Polling (Replaces Real-time) ====================

    subscribeToPartnerNotes(callback: (note: Note) => void) {
        // Simple polling every 5 seconds
        // We need to track 'last fetched' or just blindly fetch latest?
        // Blindly fetching entire list might be heavy if list is long.
        // For now, let's just fetch latest note.

        let lastNoteTimestamp = Date.now();

        const interval = setInterval(async () => {
            const notes = await this.getPartnerNotes();
            if (notes.length > 0) {
                const latest = notes[0]; // Assuming order is desc timestamp
                if (latest.timestamp > lastNoteTimestamp) {
                    lastNoteTimestamp = latest.timestamp;
                    callback(latest);
                }
            }
        }, 5000);

        return {
            unsubscribe: () => clearInterval(interval)
        };
    },

    async clearAll(): Promise<void> {
        await AsyncStorage.clear();
    }
};
