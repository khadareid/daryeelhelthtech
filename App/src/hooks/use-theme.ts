import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';

export function useTheme() {
  const { theme } = useThemePreference();
  return Colors[theme];
}
