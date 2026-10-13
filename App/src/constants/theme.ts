import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  primary: '#146AFB',
  dark: '#0B3D91',
  light: '#EAF2FF',
  bg: '#F5F7FA',
  text: '#1E293B',
  muted: '#64748B',
  success: '#10B981',
  danger: '#EF4444',
  white: '#FFFFFF',
  border: '#DBEAFE',
} as const;

export const Colors = {
  light: {
    text: Brand.text,
    background: Brand.bg,
    backgroundElement: Brand.white,
    backgroundSelected: Brand.light,
    textSecondary: Brand.muted,
    primary: Brand.primary,
    brandDark: Brand.dark,
    border: Brand.border,
    danger: Brand.danger,
    success: Brand.success,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B1220',
    backgroundElement: '#151E2E',
    backgroundSelected: '#1E2A40',
    textSecondary: '#94A3B8',
    primary: '#3B82F6',
    brandDark: '#93C5FD',
    border: '#1E3A5F',
    danger: '#F87171',
    success: '#34D399',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: Platform.select({
    ios: 'ui-monospace',
    default: 'monospace',
    web: 'var(--font-mono)',
  }),
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
