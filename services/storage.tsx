import { AndroidWidget } from '@/components/AndroidWidget';
import { Note, Task, UserProfile } from '@/constants/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { requestWidgetUpdate } from 'react-native-android-widget';

// API Base URL - In dev, likely localhost or dev server IP.
// Vercel deployment URL or localhost
const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

// Exporting types for backward compatibility if other files import locally
export type { Note, Task, UserProfile };

const KEYS = {
    USER_ID: 'lovii_user_id', // Replaces PROFILE_ID
    USER_DATA: 'lovii_user_data_json', // Store full object
    PARTNER_ID: 'lovii_partner_id',
    THEME_GENDER: 'lovii_theme_gender',
    THEME_PREF: 'lovii_theme_pref',
    THEME_MODE: 'lovii_theme_mode',
    LOCAL_NOTES: 'lovii_local_notes',
    LOCAL_TASKS: 'lovii_local_tasks',
};

const WIDGET_NAME = 'LoviiWidget';

export const StorageService = {
    // ==================== User / Profile ====================

    // This is now "GetUser" basically
    async getProfile(): Promise<UserProfile | null> {
        try {
            // 1. Try Local Storage
            const localData = await AsyncStorage.getItem(KEYS.USER_DATA);
            const userId = await AsyncStorage.getItem(KEYS.USER_ID);

            if (localData) {
                const parsed = JSON.parse(localData);
                // Background Sync
                this.syncProfile(parsed.id).catch(e => console.log('Background sync failed:', e));
                return parsed;
            }

            if (userId) {
                const synced = await this.syncProfile(userId);
                return synced;
            }

            return null;
        } catch (error) {
            console.error('getProfile error:', error);
            return null;
        }
    },

    async syncProfile(id: string): Promise<UserProfile | null> {
        try {
            const res = await fetch(`${API_URL}/profile?id=${id}`);
            if (!res.ok) return null;
            const data = await res.json();

            // Map API User -> UserProfile
            const localGender = await AsyncStorage.getItem(KEYS.THEME_GENDER);
            const localThemePref = await AsyncStorage.getItem(KEYS.THEME_PREF);
            const localThemeMode = await AsyncStorage.getItem(KEYS.THEME_MODE);

            const profile: UserProfile = {
                id: data.id,
                name: data.name || 'User',
                partnerCode: data.code, // User Code = Partner Code
                connectedPartnerId: data.partnerId || undefined,
                partnerName: data.partnerName || undefined,
                anniversary: data.connectedAt ? new Date(data.connectedAt).getTime() : undefined,
                gender: (localGender as 'male' | 'female') || 'female',
                avatarUri: data.avatar,
                themePreference: (localThemePref as any) || 'auto',
                themeMode: (localThemeMode as any) || 'auto',
            };

            // Update Local Cache
            await this.saveLocalProfile(profile);

            return profile;
        } catch (e) {
            console.log('Sync profile failed (network error)', e);
            return null;
        }
    },

    async saveLocalProfile(profile: UserProfile): Promise<void> {
        await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(profile));
        await AsyncStorage.setItem(KEYS.USER_ID, profile.id);
        if (profile.connectedPartnerId) await AsyncStorage.setItem(KEYS.PARTNER_ID, profile.connectedPartnerId);
    },

    async updateLocalGender(gender: 'male' | 'female'): Promise<void> {
        await AsyncStorage.setItem(KEYS.THEME_GENDER, gender);
        const p = await this.getProfile();
        if (p) {
            p.gender = gender;
            await this.saveLocalProfile(p);
        }
    },

    async updateThemePreference(preference: 'ocean' | 'sunset' | 'lavender' | 'mint' | 'auto'): Promise<void> {
        await AsyncStorage.setItem(KEYS.THEME_PREF, preference);
        const p = await this.getProfile();
        if (p) {
            p.themePreference = preference;
            await this.saveLocalProfile(p);
        }
    },

    async updateThemeMode(mode: 'light' | 'dark' | 'auto'): Promise<void> {
        await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
        const p = await this.getProfile();
        if (p) {
            p.themeMode = mode;
            await this.saveLocalProfile(p);
        }
    },

    async updateAvatar(uri: string): Promise<void> {
        const p = await this.getProfile();
        if (p) {
            p.avatarUri = uri;
            await this.saveLocalProfile(p);
            // Sync with server
            fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: p.id, avatar: uri }),
            }).catch(e => console.log('Avatar sync failed'));
        }
    },

    // Called by LOGIN/REGISTER to set initial state
    async setSession(user: any): Promise<void> {
        const profile: UserProfile = {
            id: user.id,
            name: user.name,
            partnerCode: user.code,
            avatarUri: user.avatar,
            gender: 'female', // Default
        };
        await this.saveLocalProfile(profile);
    },

    // Legacy method - mostly unused now as Auth handles creation
    async createProfile(): Promise<UserProfile> {
        // Just return null or throw? 
        // Or if anonymous mode needed...
        throw new Error("Use AuthService.register");
    },

    // Legacy - removed
    async recoverProfile(code: string): Promise<boolean> {
        return false;
    },

    // Save profile updates to server (Name, etc)
    async saveProfile(profile: UserProfile): Promise<void> {
        await this.saveLocalProfile(profile);
        try {
            await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: profile.id,
                    name: profile.name,
                }),
            });
        } catch (e) { console.error('saveProfile sync error', e); }
    },

    async connectToPartner(partnerCode: string): Promise<boolean> {
        try {
            const myId = await AsyncStorage.getItem(KEYS.USER_ID);
            const res = await fetch(`${API_URL}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ myId, partnerCode }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success || data.partnerId) {
                    const p = await this.getProfile();
                    if (p) {
                        p.connectedPartnerId = data.partnerId;
                        p.partnerName = data.partnerName;
                        await this.saveLocalProfile(p);
                    }
                    return true;
                }
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
            const localNotesJson = await AsyncStorage.getItem(KEYS.LOCAL_NOTES);
            const localNotes: Note[] = localNotesJson ? JSON.parse(localNotesJson) : [];
            const updatedNotes = [note, ...localNotes];
            await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(updatedNotes));

            const userId = await AsyncStorage.getItem(KEYS.USER_ID);
            if (userId) {
                fetch(`${API_URL}/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profileId: userId, // API expects profileId/userId
                        ...note
                    }),
                }).catch(e => console.log('Note sync failed:', e));
            }
        } catch (error) {
            console.error('saveMyNote error:', error);
        }
    },

    async getLatestPartnerNote(): Promise<Note | null> {
        const notes = await this.getPartnerNotes();
        return notes.length > 0 ? notes[0] : null;
    },

    async getMyHistory(): Promise<Note[]> {
        let localNotes: Note[] = [];
        try {
            const localJson = await AsyncStorage.getItem(KEYS.LOCAL_NOTES);
            if (localJson) localNotes = JSON.parse(localJson);
        } catch (e) {
            console.warn('Error loading local notes:', e);
        }

        const userId = await AsyncStorage.getItem(KEYS.USER_ID);
        if (userId) {
            fetch(`${API_URL}/notes?profileId=${userId}`)
                .then(res => res.json())
                .then(async (data) => {
                    if (data.error) return;
                    // Merge
                    const remoteNotes: Note[] = data.map((n: any) => ({
                        id: n.id, type: n.type, content: n.content, timestamp: n.timestamp,
                        color: n.color, images: n.images, pinned: n.pinned, bookmarked: n.bookmarked
                    }));

                    const merged = [...remoteNotes, ...localNotes].filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i);
                    merged.sort((a, b) => b.timestamp - a.timestamp);
                    await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(merged));
                })
                .catch(e => console.log('History fetch failed'));
        }

        return localNotes;
    },

    async getPartnerNotes(): Promise<Note[]> {
        try {
            const partnerId = await AsyncStorage.getItem(KEYS.PARTNER_ID);
            if (!partnerId) return [];

            const res = await fetch(`${API_URL}/notes?profileId=${partnerId}`);
            if (!res.ok) return [];

            const data = await res.json();
            return data.map((n: any) => ({
                id: n.id, type: n.type, content: n.content, timestamp: n.timestamp,
                color: n.color, images: n.images, pinned: n.pinned, bookmarked: n.bookmarked
            }));
        } catch (error) {
            return [];
        }
    },

    async updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
        try {
            const localJson = await AsyncStorage.getItem(KEYS.LOCAL_NOTES);
            let notes: Note[] = localJson ? JSON.parse(localJson) : [];
            notes = notes.map(n => n.id === noteId ? { ...n, ...updates } : n);
            await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(notes));

            fetch(`${API_URL}/notes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: noteId, ...updates }),
            }).catch(e => console.log('Update note failed'));

        } catch (e) { }
    },

    async deleteNote(noteId: string): Promise<void> {
        try {
            const localJson = await AsyncStorage.getItem(KEYS.LOCAL_NOTES);
            let notes: Note[] = localJson ? JSON.parse(localJson) : [];
            notes = notes.filter(n => n.id !== noteId);
            await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(notes));

            fetch(`${API_URL}/notes?id=${noteId}`, {
                method: 'DELETE',
            }).catch(e => console.log('Delete note failed'));
        } catch (error) {
            console.error('deleteNote error:', error);
        }
    },

    async togglePin(noteId: string, currentPinned: boolean): Promise<void> {
        await this.updateNote(noteId, { pinned: !currentPinned });
    },

    async toggleBookmark(noteId: string, currentBookmarked: boolean): Promise<void> {
        await this.updateNote(noteId, { bookmarked: !currentBookmarked });
    },

    // ==================== Tasks ====================

    async getTasks(): Promise<Task[]> {
        try {
            const localJson = await AsyncStorage.getItem(KEYS.LOCAL_TASKS);
            let tasks: Task[] = localJson ? JSON.parse(localJson) : [];

            // TODO: Add Sync
            return tasks;
        } catch (error) {
            return [];
        }
    },

    async saveTasks(tasks: Task[]): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.LOCAL_TASKS, JSON.stringify(tasks));
            const userId = await AsyncStorage.getItem(KEYS.USER_ID);
            if (userId) {
                // For now, fire and forget sync
                // Note: tasks API expects bulk or single. Currently simplified.
                // We need to implement proper sync but for now keeping it local-first.
            }
        } catch (error) { }
    },

    subscribeToPartnerNotes(callback: (note: Note) => void) {
        let lastNoteTimestamp = Date.now();
        const interval = setInterval(async () => {
            const notes = await this.getPartnerNotes();
            if (notes.length > 0) {
                const latest = notes[0];
                if (latest.timestamp > lastNoteTimestamp) {
                    lastNoteTimestamp = latest.timestamp;
                    callback(latest);

                    requestWidgetUpdate({
                        widgetName: WIDGET_NAME,
                        renderWidget: () => (
                            <AndroidWidget
                                content={latest.content}
                                type={latest.type}
                                timestamp={latest.timestamp}
                                color={latest.color}
                                hasPartnerNote={true}
                            />
                        ),
                        widgetNotFound: () => { }
                    });
                }
            }
        }, 5000);
        return { unsubscribe: () => clearInterval(interval) };
    },

    async clearAll(): Promise<void> {
        await AsyncStorage.clear();
    },

    async sendToPartnerWidget(note: Note): Promise<any> {
        try {
            const userId = await AsyncStorage.getItem(KEYS.USER_ID);
            if (!userId) return { success: false, error: 'Not logged in' };

            // Save locally first
            await this.saveMyNote(note);

            const response = await fetch(`${API_URL}/widget`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    myId: userId,
                    note
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                return { success: false, error: data.error || 'Failed to send' };
            }

            const result = await response.json();
            return {
                success: true,
                partner: result.partner,
                partnerWidget: result.partnerWidget
            };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    },

    async getPartnerWidgetStatus(): Promise<any> {
        try {
            const userId = await AsyncStorage.getItem(KEYS.USER_ID);
            if (!userId) return { connected: false };

            const response = await fetch(`${API_URL}/widget?myId=${userId}`);
            if (!response.ok) return { connected: false };

            return await response.json();
        } catch (e) { return { connected: false }; }
    },

    async updateWidget() {
        // Same widget update logic...
        const pId = await AsyncStorage.getItem(KEYS.PARTNER_ID);
        // ... implementation same as before but fetching notes
    }
};
