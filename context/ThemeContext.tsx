import { Palettes } from '@/constants/theme';
import { StorageService } from '@/services/storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark';
type GenderType = 'male' | 'female' | null;

interface ThemeContextType {
    theme: typeof Palettes.soft;
    gender: GenderType;
    setGender: (g: GenderType) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: Palettes.soft,
    gender: null,
    setGender: () => { },
    isDark: false, // Soft is Light Mode
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();
    const [gender, setGender] = useState<GenderType>(null);

    useEffect(() => {
        loadGender();
    }, []);

    const loadGender = async () => {
        const profile = await StorageService.getProfile();
        if (profile?.gender) {
            setGender(profile.gender);
        }
    };

    const handleSetGender = async (g: GenderType) => {
        setGender(g);
        if (g) {
            await StorageService.updateLocalGender(g);
        }
    };

    // Select palette based on gender
    const activePalette = gender === 'female' ? Palettes.pink : Palettes.soft;

    return (
        <ThemeContext.Provider value={{
            theme: activePalette,
            gender,
            setGender: handleSetGender,
            isDark: false // Force light for soft theme
        }}>
            {children}
        </ThemeContext.Provider>
    );
}
