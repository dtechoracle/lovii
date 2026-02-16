import { Palettes } from '@/constants/theme';
import { ThemeMode, ThemePreference } from '@/constants/types';
import { StorageService } from '@/services/storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextType {
    theme: typeof Palettes.ocean.light;
    themePreference: ThemePreference;
    themeMode: ThemeMode;
    isDark: boolean;
    setThemePreference: (preference: ThemePreference) => Promise<void>;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
    setGender: (gender: 'male' | 'female') => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: Palettes.ocean.light,
    themePreference: 'ocean',
    themeMode: 'auto',
    isDark: false,
    setThemePreference: async () => { },
    setThemeMode: async () => { },
    setGender: async () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('ocean');
    const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');

    useEffect(() => {
        loadThemePreferences();
    }, []);

    const loadThemePreferences = async () => {
        const profile = await StorageService.getProfile();

        // Migration: Convert old gender-based themes to new system
        if (profile?.gender && !profile?.themePreference) {
            const migratedTheme: ThemePreference = profile.gender === 'female' ? 'sunset' : 'ocean';
            setThemePreferenceState(migratedTheme);
            await StorageService.updateThemePreference(migratedTheme);
        } else if (profile?.themePreference) {
            setThemePreferenceState(profile.themePreference);
        }

        if (profile?.themeMode) {
            setThemeModeState(profile.themeMode);
        }
    };

    const setThemePreference = async (preference: ThemePreference) => {
        setThemePreferenceState(preference);
        await StorageService.updateThemePreference(preference);
    };

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        await StorageService.updateThemeMode(mode);
    };

    // Determine if dark mode should be active
    const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemScheme === 'dark');

    // Select the appropriate theme palette
    const getActivePalette = () => {
        const paletteKey = themePreference === 'auto' ? 'ocean' : themePreference;
        const palette = Palettes[paletteKey];
        return isDark ? palette.dark : palette.light;
    };

    const setGender = async (gender: 'male' | 'female') => {
        // Find associated theme
        const theme = gender === 'female' ? 'sunset' : 'ocean';
        setThemePreferenceState(theme);
        await StorageService.updateLocalGender(gender);
        await StorageService.updateThemePreference(theme); // Also update theme pref
    };

    return (
        <ThemeContext.Provider value={{
            theme: getActivePalette(),
            themePreference,
            themeMode,
            isDark,
            setThemePreference,
            setThemeMode,
            setGender,
        }}>
            {children}
        </ThemeContext.Provider>
    );
}
