/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { theme } = useTheme();
  // If props are provided, use them based on current theme mode? 
  // Wait, our ThemeContext forces Dark Mode but has gendered palettes.
  // Let's assume 'dark' since we force dark mode, or better yet, just use the gendered palette directly.

  // Actually, standard usage of this hook is for light/dark mode switching.
  // Our app overrides this with gendered themes.
  // So we should return the color from the current context theme if available.

  // Check if the requested colorName exists in our active palette
  // Our Palette has: primary, secondary, background, card, text, tint, tabIconSelected
  // Colors.dark has: text, background, tint, icon, tabIconDefault, tabIconSelected, card, primary, textSecondary

  // Let's map attempts.
  if (colorName in theme) {
    // @ts-ignore
    return theme[colorName];
  }

  // Fallback to Colors.dark (Yellow) if not in gender palette?
  // Or just return Colors.dark[colorName]

  return Colors.dark[colorName];
}
