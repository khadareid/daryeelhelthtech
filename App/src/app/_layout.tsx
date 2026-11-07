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

/** Stack screens (outside tabs) always show a clear Back header. Tabs keep their own footer. */
function stackHeader(theme: ReturnType<typeof useTheme>, title: string) {
  return {
    headerShown: true,
    title,
    headerBackTitle: 'Back',
    headerBackVisible: true,
    headerTintColor: theme.primary,
    headerStyle: { backgroundColor: theme.backgroundElement },
    headerShadowVisible: false,
    headerTitleStyle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      color: theme.brandDark,
    },
    contentStyle: { backgroundColor: theme.background },
    presentation: 'card' as const,
    animation: 'slide_from_right' as const,
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
        {/* Entry / auth — no tab footer, no back needed */}
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />

        {/* Main tabs — bottom footer only, no back */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Detail / health stack — full header with Back */}
        <Stack.Screen
          name="doctor/[id]"
          options={stackHeader(theme, 'Book visit')}
        />
        <Stack.Screen
          name="notifications"
          options={stackHeader(theme, 'Notifications')}
        />
        <Stack.Screen
          name="health/payments"
          options={stackHeader(theme, 'Payments')}
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
