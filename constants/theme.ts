/**
 * Soft Playful Theme
 * Periwinkle Blue Background + White Cards + Soft Shadows
 */

const tintColorLight = '#4B6EFF';
const tintColorDark = '#4B6EFF';

export const Palettes = {
  soft: {
    primary: '#4B6EFF', // Soft Royal Blue
    secondary: '#A5B4FC', // Periwinkle
    background: '#EFF4FF', // Very soft blue-white
    card: '#FFFFFF',
    text: '#1C1C1E', // Soft Black
    tint: '#5856D6',
    border: 'transparent',
    shadow: '#000000',
  }
};

export const Colors = {
  light: {
    text: '#1C1C1E',
    background: '#EFF4FF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#1C1C1E', // Enforce Light Mode Text 
    background: '#EFF4FF',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
