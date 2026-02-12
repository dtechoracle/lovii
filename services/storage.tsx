import { AndroidWidget } from '@/components/AndroidWidget';
import { Note, Task, UserProfile } from '@/constants/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';

// API Base URL - In dev, likely localhost or dev server IP.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api';

// Exporting types for backward compatibility if other files import locally
export type { Note, Task, UserProfile };

const KEYS = {
    PROFILE_ID: 'lovii_profile_id',
    PROFILE_CODE: 'lovii_profile_code',
    PROFILE_DATA: 'lovii_profile_data_json', // Store full object
    PARTNER_ID: 'lovii_partner_id',
    THEME_GENDER: 'lovii_theme_gender',
    LOCAL_NOTES: 'lovii_local_notes',
    LOCAL_TASKS: 'lovii_local_tasks',
};

const WIDGET_NAME = 'LoviiWidget';

// Helper for UUID generation
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const StorageService = {
    // ==================== Profile ====================

    async getProfile(): Promise<UserProfile | null> {
        try {
            // 1. Try Local Storage First (Offline-First)
            const localData = await AsyncStorage.getItem(KEYS.PROFILE_DATA);
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);

            // MIGRATION: Fix any ID that is NOT a valid UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            // If we have full local data, validate ID
            if (localData) {
                const parsed = JSON.parse(localData);

                if (parsed.id && !uuidRegex.test(parsed.id)) {
                    console.log('[Migration] Converting invalid ID "' + parsed.id + '" to valid UUID...');
                    parsed.id = generateUUID();
                    // Save immediately to persist the new UUID
                    await this.saveProfile(parsed);
                    // Return here, because saveProfile will trigger sync
                    return parsed;
                }

                // Background Sync
                this.syncProfile(parsed.id).catch(e => console.log('Background sync failed:', e));
                return parsed;
            }

            // If we only have ID but no data object (migration case), try fetching
            if (profileId) {
                // If ID is invalid, we can't sync or use it. Dropping it.
                if (!uuidRegex.test(profileId)) {
                    console.log('[Migration] Dropping invalid legacy ID:', profileId);
                    await AsyncStorage.removeItem(KEYS.PROFILE_ID);
                    return null; // Will trigger createProfile flow if handled by caller
                }

                const synced = await this.syncProfile(profileId);
                if (synced) return synced;

                // If fetch failed, reconstruct minimal profile from what we have
                const code = await AsyncStorage.getItem(KEYS.PROFILE_CODE) || 'UNKNOWN';
                return {
                    id: profileId,
                    name: 'User',
                    partnerCode: code,
                };
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

            // Local override for theme if not in DB yet
            const localGender = await AsyncStorage.getItem(KEYS.THEME_GENDER);

            const profile: UserProfile = {
                id: data.id,
                name: data.name || 'User',
                partnerCode: data.partnerCode,
                connectedPartnerId: data.partnerId || undefined,
                partnerName: data.partnerName || undefined,
                anniversary: data.anniversary || undefined,
                gender: (localGender as 'male' | 'female') || data.gender,
            };

            // Update Local Cache
            await AsyncStorage.setItem(KEYS.PROFILE_DATA, JSON.stringify(profile));
            await AsyncStorage.setItem(KEYS.PROFILE_ID, profile.id);
            if (profile.partnerCode) await AsyncStorage.setItem(KEYS.PROFILE_CODE, profile.partnerCode);
            if (profile.connectedPartnerId) await AsyncStorage.setItem(KEYS.PARTNER_ID, profile.connectedPartnerId);

            return profile;
        } catch (e) {
            console.log('Sync profile failed (network error)');
            return null;
        }
    },


    async updateLocalGender(gender: 'male' | 'female'): Promise<void> {
        await AsyncStorage.setItem(KEYS.THEME_GENDER, gender);
        // Update cached profile object too
        const p = await this.getProfile();
        if (p) {
            p.gender = gender;
            await this.saveProfile(p);
        }
    },

    async recoverProfile(code: string): Promise<boolean> {
        try {
            // Attempt to find profile by code
            const res = await fetch(`${API_URL}/recover?code=${code}`);
            if (!res.ok) return false;

            const data = await res.json();
            if (!data || !data.profile) return false;

            const profile = data.profile;

            // Rehydrate Local Storage
            await AsyncStorage.setItem(KEYS.PROFILE_DATA, JSON.stringify(profile));
            await AsyncStorage.setItem(KEYS.PROFILE_ID, profile.id);
            if (profile.partnerCode) await AsyncStorage.setItem(KEYS.PROFILE_CODE, profile.partnerCode);
            if (profile.connectedPartnerId) await AsyncStorage.setItem(KEYS.PARTNER_ID, profile.connectedPartnerId);
            if (profile.gender) await AsyncStorage.setItem(KEYS.THEME_GENDER, profile.gender);

            return true;
        } catch (error) {
            console.error('Recovery failed', error);
            return false;
        }
    },

    async createProfile(): Promise<UserProfile> {
        // Try Network First
        try {
            const res = await fetch(`${API_URL}/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'User' }),
            });

            if (res.ok) {
                const data = await res.json();
                const profile: UserProfile = {
                    id: data.id,
                    name: data.name || 'User',
                    partnerCode: data.partnerCode,
                };
                await this.saveProfile(profile);
                return profile;
            }
        } catch (e) {
            // fall through to local gen
        }

        // Fallback: Generate Local Profile (Offline Mode)
        const profile: UserProfile = {
            id: 'local_' + Date.now().toString(),
            name: 'User',
            partnerCode: Math.random().toString(36).substr(2, 6).toUpperCase()
        };
        await this.saveProfile(profile);
        return profile;
    },

    async saveProfile(profile: UserProfile): Promise<void> {
        try {
            // 1. Update Local Storage first (Critical)
            await AsyncStorage.setItem(KEYS.PROFILE_DATA, JSON.stringify(profile));
            await AsyncStorage.setItem(KEYS.PROFILE_ID, profile.id);
            if (profile.partnerCode) await AsyncStorage.setItem(KEYS.PROFILE_CODE, profile.partnerCode);
            if (profile.connectedPartnerId) await AsyncStorage.setItem(KEYS.PARTNER_ID, profile.connectedPartnerId);
            if (profile.gender) await AsyncStorage.setItem(KEYS.THEME_GENDER, profile.gender);

            // 2. Sync with Backend (Await this now to ensure DB consistency)
            console.log('[saveProfile] Syncing to backend...');
            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });

            if (!response.ok) {
                console.error('[saveProfile] Sync failed:', response.status);
            } else {
                console.log('[saveProfile] Sync success');
                const serverProfile = await response.json();

                // If server assigned a new ID (UUID migration), update local storage
                if (serverProfile && serverProfile.id && serverProfile.id !== profile.id) {
                    console.log('[saveProfile] Updating local ID to:', serverProfile.id);
                    // Update the object in memory/storage
                    profile.id = serverProfile.id;
                    await AsyncStorage.setItem(KEYS.PROFILE_ID, profile.id);
                    await AsyncStorage.setItem(KEYS.PROFILE_DATA, JSON.stringify(profile));
                }
            }

        } catch (error) {
            console.error('saveProfile error:', error);
        }
    },

    async connectToPartner(partnerCode: string): Promise<boolean> {
        // Optimistic Local Update
        const p = await this.getProfile();
        if (p) {
            p.connectedPartnerId = 'partner_' + partnerCode; // Temporary placeholder ID
            await this.saveProfile(p);
        }

        try {
            const myId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            const res = await fetch(`${API_URL}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ myId, partnerCode }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    if (p) {
                        p.connectedPartnerId = data.partnerId;
                        p.partnerName = data.partnerName || p.partnerName;
                        // Persist the verified connection
                        await this.saveProfile(p);
                    }
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('connectToPartner error:', error);
            // Revert optimistic update if needed, but for now just return false
            // Ideally we should reload profile from server to sync state
            return false;
        }
    },

    // ==================== Notes ====================

    async saveMyNote(note: Note): Promise<void> {
        try {
            // 1. Save Locally
            const localNotesJson = await AsyncStorage.getItem(KEYS.LOCAL_NOTES);
            const localNotes: Note[] = localNotesJson ? JSON.parse(localNotesJson) : [];
            const updatedNotes = [note, ...localNotes];
            await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(updatedNotes));

            // 2. Sync with Backend
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            if (profileId) {
                fetch(`${API_URL}/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profileId,
                        ...note
                    }),
                }).catch(e => console.log('Note sync failed:', e));
            }

            // No need to update widget for my OWN note, only for partner's notes.

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

        // Background Fetch
        const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
        if (profileId) {
            fetch(`${API_URL}/notes?profileId=${profileId}`)
                .then(res => res.json())
                .then(async (data) => {
                    // Merge and save
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
        // Return mostly from server, but maybe cache last known?
        // For now, just try fetch, return empty if fail
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
        // Optimistic Local Update
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
            // 1. Remove Locally
            const localJson = await AsyncStorage.getItem(KEYS.LOCAL_NOTES);
            let notes: Note[] = localJson ? JSON.parse(localJson) : [];
            notes = notes.filter(n => n.id !== noteId);
            await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(notes));

            // 2. Sync with Backend
            fetch(`${API_URL}/notes?id=${noteId}`, {
                method: 'DELETE',
            }).catch(e => console.log('Delete note failed'));

            // Update widget to reflect deletion? Maybe not strictly necessary strictly, but good practice.

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

            // Background sync logic could go here
            return tasks;
        } catch (error) {
            return [];
        }
    },

    async saveTasks(tasks: Task[]): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.LOCAL_TASKS, JSON.stringify(tasks));
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            if (profileId) {
                // simple fire and forget
                const payload = tasks.map(t => ({ profileId, text: t.text, completed: t.completed }));
                fetch(`${API_URL}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }).catch(e => console.log('Task sync failed'));
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

                    // TRIGGER WIDGET UPDATE HERE
                    requestWidgetUpdate({
                        widgetName: WIDGET_NAME,
                        renderWidget: () => (
                            <AndroidWidget
                                content={latest.content}
                                type={latest.type}
                                timestamp={latest.timestamp}
                                color={latest.color}
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

    async sendToPartnerWidget(note: Note): Promise<{ success: boolean; error?: string }> {
        try {
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);
            if (!profileId) {
                console.error('[sendToPartnerWidget] No profile ID found');
                return { success: false, error: 'No profile ID found. Please restart the app.' };
            }

            console.log('[sendToPartnerWidget] Profile ID:', profileId);
            console.log('[sendToPartnerWidget] API URL:', API_URL);

            // 1. Save locally so it shows in MY app's WidgetCard
            const localNotesJson = await AsyncStorage.getItem(KEYS.LOCAL_NOTES);
            const localNotes: Note[] = localNotesJson ? JSON.parse(localNotesJson) : [];
            const updatedNotes = [note, ...localNotes];
            await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(updatedNotes));

            // 2. Send to backend so partner can fetch it
            console.log('[sendToPartnerWidget] Sending to backend...');
            const response = await fetch(`${API_URL}/notes?profileId=${profileId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileId, // THIS IS MY ID (sending in both body and query to be safe)
                    ...note
                }),
            });

            if (!response.ok) {
                const status = response.status;
                const errorText = await response.text();
                console.error('[sendToPartnerWidget] Backend error:', status, errorText);
                return { success: false, error: `Server Error (${status}): ${errorText.slice(0, 50)}` };
            }

            console.log('[sendToPartnerWidget] Successfully sent to backend');
            return { success: true };
        } catch (error) {
            console.error('[sendToPartnerWidget] Exception:', error);
            if (error instanceof TypeError && error.message.includes('Network request failed')) {
                return { success: false, error: 'Network Error: Check internet connection.' };
            }
            return { success: false, error: String(error) };
        }
    },

    // Force update the widget with current state (useful for app start)
    async updateWidget() {
        try {
            const latestNote = await this.getLatestPartnerNote();
            const partnerNotes = await this.getPartnerNotes();

            // Simple streak calc for local update
            // (We could import the one from task handler but let's keep it simple here or duplicate for safety)
            const streak = 0; // The widget task handler will re-calc this anyway when triggered

            requestWidgetUpdate({
                widgetName: WIDGET_NAME,
                renderWidget: () => {
                    if (!latestNote) {
                        return (
                            <AndroidWidget
                                content=""
                                type="text"
                                timestamp={Date.now()}
                                hasPartnerNote={false}
                            />
                        );
                    }
                    return (
                        <AndroidWidget
                            content={latestNote.content}
                            type={latestNote.type}
                            timestamp={latestNote.timestamp}
                            color={latestNote.color}
                            streak={streak} // 0 here, but task handler will fix it on next run
                            hasPartnerNote={true}
                        />
                    );
                },
                widgetNotFound: () => { }
            });
        } catch (e) {
            console.error('Failed to update widget:', e);
        }
    }
};
