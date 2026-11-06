import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppLoadingSkeleton } from '@/components/skeleton';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider, useThemePreference } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

function stackHeader(theme: ReturnType<typeof useTheme>, title: string) {
  return {
    headerShown: true,
    title,
    headerTintColor: theme.primary,
    headerStyle: { backgroundColor: theme.backgroundElement },
    headerTitleStyle: {
      fontFamily: 'Inter_600SemiBold',
      color: theme.brandDark,
    },
    presentation: 'card' as const,
  };
}

function RootNavigation() {
  const theme = useTheme();
  const { isDark } = useThemePreference();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="doctor/[id]"
          options={stackHeader(theme, 'Doctor profile')}
        />
        <Stack.Screen
          name="notifications"
          options={{
            ...stackHeader(theme, 'Notifications'),
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="health/allergies"
          options={stackHeader(theme, 'Allergies')}
        />
        <Stack.Screen
          name="health/medications"
          options={stackHeader(theme, 'Medications')}
        />
        <Stack.Screen
          name="health/vitals"
          options={stackHeader(theme, 'Vital signs')}
        />
        <Stack.Screen
          name="health/prescriptions"
          options={stackHeader(theme, 'Prescriptions')}
        />
        <Stack.Screen
          name="health/medical-records"
          options={stackHeader(theme, 'Medical records')}
        />
        <Stack.Screen
          name="health/emergency-card"
          options={stackHeader(theme, 'Emergency card')}
        />
        <Stack.Screen
          name="health/family"
          options={stackHeader(theme, 'Family members')}
        />
        <Stack.Screen
          name="health/steps"
          options={stackHeader(theme, 'Steps')}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <AppLoadingSkeleton />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </ThemeProvider>
  );
}
