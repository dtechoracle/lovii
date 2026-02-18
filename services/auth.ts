
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

export interface User {
    id: string;
    code: string;
    name: string;
    avatar?: string;
}

export const AuthService = {
    async register(name: string, password: string, avatar?: string): Promise<{ success: boolean; user?: User; error?: string }> {
        try {
            console.log('[AuthService] Using API_URL:', API_URL);
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, avatar }),
            });
            const text = await res.text();
            console.log('[AuthService] Register raw response:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('[AuthService] JSON Parse Error:', e);
                throw new Error('Server returned invalid response: ' + text.substring(0, 50));
            }
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            return { success: true, user: data.user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async login(code: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            return { success: true, user: data.user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async logout(): Promise<void> {
        // Since we are using stateless JWT/Session on client, logging out is mostly client-side.
        // If there was a server-side session to invalidate, we'd call it here.
        return Promise.resolve();
    }
};
