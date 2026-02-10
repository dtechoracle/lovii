/**
 * Lovii Theme Colors
 * Based on the "Premium Dark" aesthetic.
 */

import { Platform } from 'react-native';

const tintColorLight = '#FFD60A'; // Yellow
const tintColorDark = '#FFD60A'; // Yellow

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Custom
    card: '#F2F2F7',
    primary: '#FFD60A',
    textSecondary: '#8E8E93',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212', // Deep Black
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Custom
    card: '#1C1C1E', // Dark Gray Card
    primary: '#FFD60A', // Vibrant Yellow
    textSecondary: '#8E8E93',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
