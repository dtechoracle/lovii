// Shared Types to prevent circular dependencies

export type ThemePreference = 'ocean' | 'sunset' | 'lavender' | 'mint' | 'auto';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Reaction {
    type: 'heart' | 'laugh' | 'fire' | 'sad' | 'wow';
    userId: string;
    timestamp: number;
}

export interface Comment {
    id: string;
    noteId: string;
    userId: string;
    content: string;
    timestamp: number;
}

export interface Note {
    id: string;
    type: 'text' | 'drawing' | 'collage' | 'music' | 'tasks';
    content: string;
    timestamp: number;
    color?: string;
    images?: string[];
    musicTrack?: {
        title: string;
        artist: string;
        coverUrl: string;
        previewUrl?: string;
        externalUrl?: string;
    };
    pinned?: boolean;
    bookmarked?: boolean;
    userId?: string; // Who created the note
    tasks?: Task[]; // For task lists sent to widget
    reactions?: Reaction[];
    comments?: Comment[];
    // Font styling
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecorationLine?: string;
}

export interface UserProfile {
    id: string;
    name: string;
    partnerCode: string;
    connectedPartnerId?: string;
    connectedPartnerCode?: string;
    partnerName?: string;
    anniversary?: number;
    // Replace gender with theme preference
    themePreference?: ThemePreference;
    themeMode?: ThemeMode;
    avatarUri?: string;
    points?: number;
    maxPoints?: number;
    // Deprecated but kept for migration
    gender?: 'male' | 'female';
}

export interface Task {
    id: string;
    text: string;
    completed: boolean;
    assignedTo?: 'me' | 'partner' | 'both';
    dueDate?: number;
    category?: 'chores' | 'groceries' | 'dates' | 'other';
}

export interface Milestone {
    id: string;
    title: string;
    date: number;
    type: 'anniversary' | 'birthday' | 'special' | 'custom';
    description?: string;
}

export interface MoodEntry {
    id: string;
    userId: string;
    mood: 'happy' | 'loved' | 'sad' | 'stressed' | 'excited' | 'grateful';
    note?: string;
    timestamp: number;
}
