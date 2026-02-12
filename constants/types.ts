// Shared Types to prevent circular dependencies

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
    connectedPartnerCode?: string; // The partner's code that was entered
    partnerName?: string;
    anniversary?: number;
    gender?: 'male' | 'female';
}

export interface Task {
    id: string;
    text: string;
    completed: boolean;
}
