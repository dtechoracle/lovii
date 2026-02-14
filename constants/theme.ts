/**
 * Modern Theme System with Dark Mode Support
 */

export type ThemePreference = 'ocean' | 'sunset' | 'lavender' | 'mint' | 'auto';

export const Palettes = {
  // Ocean Theme (Blue)
  ocean: {
    light: {
      primary: '#4B6EFF',
      secondary: '#A5B4FC',
      background: '#EFF4FF',
      card: '#FFFFFF',
      text: '#1C1C1E',
      textSecondary: '#8E8E93',
      tint: '#5856D6',
      border: '#E5E5EA',
      shadow: '#000000',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    dark: {
      primary: '#5B7EFF',
      secondary: '#7B8FE8',
      background: '#000000',
      card: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#98989D',
      tint: '#6B6AD6',
      border: '#38383A',
      shadow: '#000000',
      error: '#FF453A',
      success: '#32D74B',
      warning: '#FF9F0A',
    }
  },
  
  // Sunset Theme (Pink/Coral)
  sunset: {
    light: {
      primary: '#FF4B8B',
      secondary: '#FCA5C2',
      background: '#FFF0F5',
      card: '#FFFFFF',
      text: '#1C1C1E',
      textSecondary: '#8E8E93',
      tint: '#FF2D70',
      border: '#E5E5EA',
      shadow: '#000000',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    dark: {
      primary: '#FF5B9B',
      secondary: '#FF8FB5',
      background: '#000000',
      card: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#98989D',
      tint: '#FF3D80',
      border: '#38383A',
      shadow: '#000000',
      error: '#FF453A',
      success: '#32D74B',
      warning: '#FF9F0A',
    }
  },

  // Lavender Theme (Purple)
  lavender: {
    light: {
      primary: '#9D4EDD',
      secondary: '#C77DFF',
      background: '#F8F4FF',
      card: '#FFFFFF',
      text: '#1C1C1E',
      textSecondary: '#8E8E93',
      tint: '#7B2CBF',
      border: '#E5E5EA',
      shadow: '#000000',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    dark: {
      primary: '#AD5EED',
      secondary: '#C98DFF',
      background: '#000000',
      card: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#98989D',
      tint: '#8B3CCF',
      border: '#38383A',
      shadow: '#000000',
      error: '#FF453A',
      success: '#32D74B',
      warning: '#FF9F0A',
    }
  },

  // Mint Theme (Green)
  mint: {
    light: {
      primary: '#06D6A0',
      secondary: '#7FDBBB',
      background: '#F0FFF9',
      card: '#FFFFFF',
      text: '#1C1C1E',
      textSecondary: '#8E8E93',
      tint: '#05C590',
      border: '#E5E5EA',
      shadow: '#000000',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
    },
    dark: {
      primary: '#16E6B0',
      secondary: '#8FEBCB',
      background: '#000000',
      card: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#98989D',
      tint: '#15D5A0',
      border: '#38383A',
      shadow: '#000000',
      error: '#FF453A',
      success: '#32D74B',
      warning: '#FF9F0A',
    }
  },
};

export const Colors = {
  light: {
    text: '#1C1C1E',
    background: '#EFF4FF',
    tint: '#4B6EFF',
    icon: '#687076',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#4B6EFF',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: '#5B7EFF',
    icon: '#98989D',
    tabIconDefault: '#6C6C70',
    tabIconSelected: '#5B7EFF',
  },
};
