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

import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider, useThemePreference } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';
import { AppLoadingSkeleton } from '@/components/skeleton';

SplashScreen.preventAutoHideAsync();

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
          options={{
            headerShown: true,
            title: 'Doctor profile',
            headerTintColor: theme.primary,
            headerStyle: { backgroundColor: theme.backgroundElement },
            headerTitleStyle: {
              fontFamily: 'Inter_600SemiBold',
              color: theme.brandDark,
            },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="hospital/[id]"
          options={{
            headerShown: true,
            title: 'Hospital',
            headerTintColor: theme.primary,
            headerStyle: { backgroundColor: theme.backgroundElement },
            headerTitleStyle: {
              fontFamily: 'Inter_600SemiBold',
              color: theme.brandDark,
            },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: true,
            title: 'Notifications',
            headerTintColor: theme.primary,
            headerStyle: { backgroundColor: theme.backgroundElement },
            headerTitleStyle: {
              fontFamily: 'Inter_600SemiBold',
              color: theme.brandDark,
            },
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="news/index"
          options={{
            headerShown: true,
            title: 'Health news',
            headerTintColor: theme.primary,
            headerStyle: { backgroundColor: theme.backgroundElement },
            headerTitleStyle: {
              fontFamily: 'Inter_600SemiBold',
              color: theme.brandDark,
            },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="news/[id]"
          options={{
            headerShown: true,
            title: 'Article',
            headerTintColor: theme.primary,
            headerStyle: { backgroundColor: theme.backgroundElement },
            headerTitleStyle: {
              fontFamily: 'Inter_600SemiBold',
              color: theme.brandDark,
            },
            presentation: 'card',
          }}
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
