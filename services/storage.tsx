import { AndroidWidget } from '@/components/AndroidWidget';
import { Note, Task, UserProfile } from '@/constants/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
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
    PARTNER_NOTES: 'lovii_partner_notes', // NEW: Cache regarding partner notes
    LOCAL_TASKS: 'lovii_local_tasks',
    PUSH_TOKEN: 'lovii_push_token',
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

            // NEW: Get local points before overwriting to support manual testing
            const localData = await AsyncStorage.getItem(KEYS.USER_DATA);
            const localPoints = localData ? JSON.parse(localData).points : 0;
            const localMaxPoints = localData ? JSON.parse(localData).maxPoints : 0;

            const currentPoints = Math.max(data.points || 0, localPoints || 0);
            // maxPoints = the most points the user has ever had (ring reference)
            // If maxPoints is 0 (no backend support yet) but user has points, seed it from current points
            const currentMax = Math.max(data.maxPoints || 0, localMaxPoints || 0);
            const effectiveMax = currentMax > 0 ? currentMax : currentPoints;

            const profile: UserProfile = {
                id: data.id,
                name: data.name || 'User',
                partnerCode: data.code,
                connectedPartnerId: data.partnerId || undefined,
                partnerName: data.partnerName || undefined,
                connectedPartnerCode: data.partnerCode || undefined,
                anniversary: data.connectedAt ? new Date(data.connectedAt).getTime() : undefined,
                gender: (localGender as 'male' | 'female') || 'female',
                avatarUri: data.avatar,
                points: currentPoints,
                maxPoints: effectiveMax,
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

        // Ensure PARTNER_ID key is also updated for legacy compatibility & widget stability
        const pId = profile.connectedPartnerId;
        if (pId) {
            await AsyncStorage.setItem(KEYS.PARTNER_ID, pId);
        }
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
            // Optimistically update with local URI first
            p.avatarUri = uri;
            await this.saveLocalProfile(p);

            try {
                // Read as Base64
                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64',
                });
                const avatarData = `data:image/jpeg;base64,${base64}`;

                // Sync with server
                const res = await fetch(`${API_URL}/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: p.id, avatar: avatarData }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.avatar) {
                        // Update with real Cloudinary URL
                        p.avatarUri = data.avatar;
                        await this.saveLocalProfile(p);
                    }
                }
            } catch (e) {
                console.log('Avatar sync failed', e);
            }
        }
    },

    async savePushToken(token: string): Promise<void> {
        try {
            const currentToken = await AsyncStorage.getItem(KEYS.PUSH_TOKEN);
            if (currentToken === token) return; // No change

            await AsyncStorage.setItem(KEYS.PUSH_TOKEN, token);
            const userId = await AsyncStorage.getItem(KEYS.USER_ID);

            if (userId) {
                console.log('[StorageService] Syncing push token to backend...');
                fetch(`${API_URL}/auth/pushtoken`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, token }),
                }).catch(e => console.log('Push token sync failed', e));
            }
        } catch (e) {
            console.error('Error saving push token', e);
        }
    },

    // Called by LOGIN/REGISTER to set initial state
    async setSession(user: any): Promise<void> {
        const profile: UserProfile = {
            id: user.id,
            name: user.name,
            partnerCode: user.code,
            avatarUri: user.avatar,
            points: user.points,
            maxPoints: user.maxPoints || user.points,
            gender: 'female', // Default
        };
        await this.saveLocalProfile(profile);

        // Sync token if we have one waiting
        const token = await AsyncStorage.getItem(KEYS.PUSH_TOKEN);
        if (token) {
            this.savePushToken(token); // Will trigger sync since UserID is now set
        }
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

    async connectToPartner(partnerCode: string): Promise<{ success: boolean; error?: string }> {
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
                        p.connectedPartnerCode = data.partnerCode;
                        await this.saveLocalProfile(p);
                        // Refresh profile after point deduction or new partner
                        await this.syncProfile(myId!);
                    }
                    return { success: true };
                }
            } else if (res.status === 403) {
                const data = await res.json();
                return { success: false, error: data.error || 'Insufficient points to add another partner.' };
            } else {
                const data = await res.json();
                return { success: false, error: data.error || 'Connection failed' };
            }
            return { success: false, error: 'Network error' };
        } catch (e) {
            console.error('connectToPartner error:', e);
            return { success: false, error: 'Connection failed' };
        }
    },

    async topUpPoints(points: number): Promise<boolean> {
        try {
            const p = await this.getProfile();
            if (!p) return false;

            // Updated: Manually add points to local profile for testing
            p.points = (p.points || 0) + points;
            // When buying, the ring becomes full - so maxPoints = current points
            p.maxPoints = p.points;
            await this.saveLocalProfile(p);
            return true;
        } catch (e) {
            console.error('topUpPoints error:', e);
            return false;
        }
    },

    async disconnectFromPartner(partnerId: string): Promise<boolean> {
        try {
            const myId = await AsyncStorage.getItem(KEYS.USER_ID);
            const res = await fetch(`${API_URL}/connect`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ myId, partnerId }),
            });

            if (res.ok) {
                await this.syncProfile(myId!);
                return true;
            }
            return false;
        } catch (e) {
            console.error('disconnectFromPartner error:', e);
            return false;
        }
    },

    // ==================== Notes ====================

    async saveMyNote(note: Note): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const p = await this.getProfile();
            if (!p) return { success: false, error: 'Profile not found' };

            // Client-side cost calculation
            let cost = 1;
            if (note.type === 'collage' || note.type === 'music') {
                cost = 2;
            }

            if ((p.points || 0) < cost) {
                return { success: false, error: `Insufficient points! This requires ${cost} points, but you have ${p.points || 0}. 💝` };
            }

            // Deduct locally (Optimistic)
            p.points = (p.points || 0) - cost;
            await this.saveLocalProfile(p);

            const hasHeavyImages = note.images && note.images.some(img => img.startsWith('data:image') && img.length > 50000);

            // 1. Save locally ONLY if not heavy (to avoid storage limits/crash)
            // If heavy, we rely on the server sync to succeed first, then save the URL version.
            if (!hasHeavyImages) {
                const localNotesJson = await AsyncStorage.getItem(KEYS.LOCAL_NOTES);
                const localNotes: Note[] = localNotesJson ? JSON.parse(localNotesJson) : [];
                const updatedNotes = [note, ...localNotes];
                await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(updatedNotes));
            }

            const userId = await AsyncStorage.getItem(KEYS.USER_ID);
            if (userId) {
                // 2. Sync to Server (Let Server generate valid UUID and handle Uploads)
                const { id, ...noteWithoutId } = note;

                try {
                    const response = await fetch(`${API_URL}/notes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            profileId: userId,
                            ...noteWithoutId
                        }),
                    });

                    if (response.ok) {
                        const serverNote = await response.json();

                        // 3. Update local note with REAL Server Data (including Cloudinary URLs)
                        const currentNotesJson = await AsyncStorage.getItem(KEYS.LOCAL_NOTES);
                        let currentNotes: Note[] = currentNotesJson ? JSON.parse(currentNotesJson) : [];

                        // If we skipped saving locally, we prepend it now
                        if (hasHeavyImages) {
                            // Ensure we map serverNote properties to Note type correctly
                            const newNote: Note = {
                                ...note, // Keep local optimistic props if any
                                ...serverNote, // Overwrite with server source of truth (ID, Images URLs)
                            };
                            currentNotes = [newNote, ...currentNotes];
                        } else {
                            // Update existing optimistic note
                            currentNotes = currentNotes.map(n =>
                                n.id === note.id ? { ...n, ...serverNote } : n
                            );
                        }

                        await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(currentNotes));
                        return { success: true, id: serverNote.id };
                    } else if (response.status === 403) {
                        return { success: false, error: 'Insufficient points! Please top up in the pricing section. 💝' };
                    } else {
                        const errorText = await response.text();
                        console.error(`Note sync failed: ${response.status} ${errorText}`);
                        return { success: false, error: `Server: ${response.status} - ${errorText.slice(0, 100)}` };
                    }
                } catch (e) {
                    console.error('Note sync network error:', e);
                    return { success: false, error: `Network: ${String(e)}` };
                }
            } else {
                console.error('saveMyNote: No User ID found in storage');
                return { success: false, error: 'Auth: No User ID. Please login.' };
            }
        } catch (error) {
            console.error('saveMyNote error:', error);
            return { success: false, error: `Storage: ${String(error)}` };
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
            try {
                const res = await fetch(`${API_URL}/notes?profileId=${userId}`);
                const data = await res.json();

                if (data.error) return localNotes;

                console.log('DEBUG: Fetched history:', JSON.stringify(data.slice(0, 3), null, 2));

                const remoteNotes: Note[] = data.map((n: any) => ({
                    id: n.id, type: n.type, content: n.content, timestamp: n.timestamp,
                    color: n.color, images: n.images, pinned: n.pinned, bookmarked: n.bookmarked,
                    fontFamily: n.fontFamily, fontWeight: n.fontWeight, fontStyle: n.fontStyle, textDecorationLine: n.textDecorationLine,
                    musicTrack: (typeof n.musicTrack === 'string' ? JSON.parse(n.musicTrack) : n.musicTrack) || (n.type === 'music' && n.content ? (() => { try { return JSON.parse(n.content); } catch (e) { return undefined; } })() : undefined),
                    tasks: (typeof n.tasks === 'string' ? JSON.parse(n.tasks) : n.tasks) || (n.type === 'tasks' && n.content ? (() => { try { return JSON.parse(n.content); } catch (e) { return undefined; } })() : undefined)
                }));

                const merged = [...remoteNotes, ...localNotes].filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i);
                merged.sort((a, b) => b.timestamp - a.timestamp);

                await AsyncStorage.setItem(KEYS.LOCAL_NOTES, JSON.stringify(merged));
                return merged;
            } catch (e) {
                console.log('History fetch failed', e);
                return localNotes;
            }
        }

        return localNotes;
    },

    async getPartnerNotes(): Promise<Note[]> {
        try {
            const partnerId = await AsyncStorage.getItem(KEYS.PARTNER_ID);

            // 1. Load Cached Notes Immediately
            let cachedNotes: Note[] = [];
            const cachedJson = await AsyncStorage.getItem(KEYS.PARTNER_NOTES);
            if (cachedJson) {
                cachedNotes = JSON.parse(cachedJson);
            }

            if (!partnerId) return cachedNotes;

            // 2. Fetch from Server
            try {
                const res = await fetch(`${API_URL}/notes?profileId=${partnerId}`);
                const data = await res.json();

                if (Array.isArray(data)) {
                    console.log('DEBUG: Fetched partner notes:', JSON.stringify(data.slice(0, 3), null, 2));
                    const remoteNotes: Note[] = data.map((n: any) => ({
                        id: n.id, type: n.type, content: n.content, timestamp: n.timestamp,
                        color: n.color, images: n.images, pinned: n.pinned, bookmarked: n.bookmarked,
                        fontFamily: n.fontFamily, fontWeight: n.fontWeight, fontStyle: n.fontStyle, textDecorationLine: n.textDecorationLine,
                        musicTrack: (typeof n.musicTrack === 'string' ? JSON.parse(n.musicTrack) : n.musicTrack) || (n.type === 'music' && n.content ? (() => { try { return JSON.parse(n.content); } catch (e) { return undefined; } })() : undefined),
                        tasks: (typeof n.tasks === 'string' ? JSON.parse(n.tasks) : n.tasks) || (n.type === 'tasks' && n.content ? (() => { try { return JSON.parse(n.content); } catch (e) { return undefined; } })() : undefined)
                    }));

                    await AsyncStorage.setItem(KEYS.PARTNER_NOTES, JSON.stringify(remoteNotes));
                    return remoteNotes;
                }
            } catch (e) {
                console.log('Partner notes sync failed', e);
            }

            return cachedNotes;
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

            fetch(`${API_URL} / notes`, {
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
                                fontFamily={latest.fontFamily}
                                fontWeight={latest.fontWeight}
                                fontStyle={latest.fontStyle}
                                textDecorationLine={latest.textDecorationLine}
                                images={latest.images}
                                musicTrack={latest.musicTrack}
                                tasks={latest.tasks}
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

            // Save locally and sync to get valid Server UUID
            const saveResult = await this.saveMyNote(note);

            if (!saveResult.success || !saveResult.id) {
                return { success: false, error: saveResult.error || 'Failed to sync note to server' };
            }

            const response = await fetch(`${API_URL}/widget`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    myId: userId,
                    noteId: saveResult.id
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

    async sendTasksToWidget(tasks: Task[]): Promise<any> {
        // Convert Task array to a Note for the widget
        const note: Note = {
            id: 'tasks_' + Date.now(),
            type: 'tasks',
            content: JSON.stringify(tasks),
            tasks: tasks,
            timestamp: Date.now(),
            color: '#4B6EFF', // Use primary brand color for tasks
        };
        return this.sendToPartnerWidget(note);
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
        try {
            const notes = await this.getPartnerNotes();
            if (notes.length > 0) {
                const latest = notes[0];
                requestWidgetUpdate({
                    widgetName: WIDGET_NAME,
                    renderWidget: () => (
                        <AndroidWidget
                            content={latest.content}
                            type={latest.type}
                            timestamp={latest.timestamp}
                            color={latest.color}
                            hasPartnerNote={true}
                            fontFamily={latest.fontFamily}
                            fontWeight={latest.fontWeight}
                            fontStyle={latest.fontStyle}
                            textDecorationLine={latest.textDecorationLine}
                            images={latest.images}
                            musicTrack={latest.musicTrack}
                            tasks={latest.tasks}
                        />
                    ),
                    widgetNotFound: () => { }
                });
            } else {
                requestWidgetUpdate({
                    widgetName: WIDGET_NAME,
                    renderWidget: () => (
                        <AndroidWidget
                            content=""
                            type="text"
                            timestamp={Date.now()}
                            hasPartnerNote={false}
                        />
                    ),
                    widgetNotFound: () => { }
                });
            }
        } catch (e) {
            console.error('updateWidget failed', e);
        }
    },

    // NEW: Handle "Webhook" style data push
    async processIncomingPartnerNote(note: Note) {
        try {
            // Get current cache
            const cachedJson = await AsyncStorage.getItem(KEYS.PARTNER_NOTES);
            let notes: Note[] = cachedJson ? JSON.parse(cachedJson) : [];

            // Add new note to top (deduplicate just in case)
            notes = [note, ...notes].filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i);

            // Save Cache
            await AsyncStorage.setItem(KEYS.PARTNER_NOTES, JSON.stringify(notes));

            // Force Widget Update immediately with this specific note data
            // This bypasses the need to fetch or read from storage again for the widget
            requestWidgetUpdate({
                widgetName: WIDGET_NAME,
                renderWidget: () => (
                    <AndroidWidget
                        content={note.content}
                        type={note.type}
                        timestamp={note.timestamp}
                        color={note.color}
                        hasPartnerNote={true}
                        fontFamily={note.fontFamily}
                        fontWeight={note.fontWeight}
                        fontStyle={note.fontStyle}
                        textDecorationLine={note.textDecorationLine}
                        images={note.images}
                        musicTrack={note.musicTrack}
                        tasks={note.tasks}
                    />
                ),
                widgetNotFound: () => { }
            });
        } catch (e) {
            console.error('processIncomingPartnerNote failed', e);
        }
    },

    async togglePartnerTask(taskId: string): Promise<void> {
        try {
            const cachedJson = await AsyncStorage.getItem(KEYS.PARTNER_NOTES);
            if (!cachedJson) return;
            const notes: Note[] = JSON.parse(cachedJson);
            if (notes.length > 0 && notes[0].type === 'tasks' && notes[0].tasks) {
                const latest = notes[0];
                latest.tasks = latest.tasks!.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
                notes[0] = latest;
                await AsyncStorage.setItem(KEYS.PARTNER_NOTES, JSON.stringify(notes));

                // Optimistically update server (tasks is JSONB — send as array, not string)
                fetch(`${API_URL}/notes`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: latest.id, tasks: latest.tasks }),
                }).catch(e => console.log('Update partner note task failed'));
            }
        } catch (error) {
            console.error('togglePartnerTask error:', error);
        }
    },

    async restoreStreak(): Promise<{ success: boolean; error?: string }> {
        const STREAK_RESTORE_COST = 5;
        try {
            const p = await this.getProfile();
            if (!p) return { success: false, error: 'Not logged in' };

            if ((p.points || 0) < STREAK_RESTORE_COST) {
                return { success: false, error: `You need ${STREAK_RESTORE_COST} points to restore your streak. You have ${p.points || 0}. 💝` };
            }

            // 1. Deduct locally (optimistic)
            p.points = (p.points || 0) - STREAK_RESTORE_COST;
            await this.saveLocalProfile(p);

            // 2. Persist today locally (offline fallback)
            const phantomKey = 'lovii_streak_restore_days';
            const restoredDaysJson = await AsyncStorage.getItem(phantomKey);
            const restoredDays: number[] = restoredDaysJson ? JSON.parse(restoredDaysJson) : [];
            const todayMidnight = (() => {
                const d = new Date();
                return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
            })();
            if (!restoredDays.includes(todayMidnight)) {
                restoredDays.push(todayMidnight);
                await AsyncStorage.setItem(phantomKey, JSON.stringify(restoredDays));
            }

            const userId = await AsyncStorage.getItem(KEYS.USER_ID);
            if (userId) {
                // 3. Record on backend (streak_restores table) + deduct points audit
                try {
                    await fetch(`${API_URL}/streak/restore`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId }),
                    });
                    fetch(`${API_URL}/profile/deduct`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, amount: STREAK_RESTORE_COST, reason: 'streak_restore' }),
                    }).catch(() => { });
                } catch (e) {
                    console.log('Streak restore backend sync failed (offline?)', e);
                }
            }

            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    },

    async getRestoredStreakDays(): Promise<number[]> {
        try {
            // Start with local cache (offline fallback)
            const json = await AsyncStorage.getItem('lovii_streak_restore_days');
            const localDays: number[] = json ? JSON.parse(json) : [];

            // Merge with server data (survives reinstalls)
            const userId = await AsyncStorage.getItem(KEYS.USER_ID);
            if (userId) {
                try {
                    const res = await fetch(`${API_URL}/streak?userId=${userId}`);
                    if (res.ok) {
                        const data = await res.json();
                        const serverDays: number[] = data.restoredDays || [];
                        // Merge and deduplicate
                        const merged = Array.from(new Set([...localDays, ...serverDays]));
                        // Update local cache with merged result
                        await AsyncStorage.setItem('lovii_streak_restore_days', JSON.stringify(merged));
                        return merged;
                    }
                } catch { /* offline — use local */ }
            }
            return localDays;
        } catch { return []; }
    },
};
