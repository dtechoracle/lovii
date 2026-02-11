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

export const StorageService = {
    // ==================== Profile ====================

    async getProfile(): Promise<UserProfile | null> {
        try {
            // 1. Try Local Storage First (Offline-First)
            const localData = await AsyncStorage.getItem(KEYS.PROFILE_DATA);
            const profileId = await AsyncStorage.getItem(KEYS.PROFILE_ID);

            // If we have full local data, return it immediately
            if (localData) {
                const parsed = JSON.parse(localData);
                // Background Sync
                this.syncProfile(parsed.id).catch(e => console.log('Background sync failed:', e));
                return parsed;
            }

            // If we only have ID but no data object (migration case), try fetching
            if (profileId) {
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

            // 2. Sync with Backend (Fire & Forget)
            fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            }).catch(e => console.log('Background save profile failed:', e));

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
                        await this.saveProfile(p);
                    }
                    return true;
                }
            }
        } catch (error) {
            // ignore, optimistic update sticks
        }
        return true;
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

    async sendToWidget(note: Note): Promise<void> {
        requestWidgetUpdate({
            widgetName: WIDGET_NAME,
            renderWidget: () => (
                <AndroidWidget
                    content={note.content}
                    type={note.type}
                    timestamp={note.timestamp}
                    color={note.color}
                />
            ),
            widgetNotFound: () => { }
        });
    }
};
