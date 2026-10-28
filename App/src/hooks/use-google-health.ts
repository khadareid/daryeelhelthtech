import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

const LINK_KEY = 'daryeel.googleHealth.linked';

/**
 * Google Health / Health Connect style link.
 * Expo managed apps sync steps via the same phone motion sensors Google Fit uses
 * (ACTIVITY_RECOGNITION + Pedometer). Optional deep-link opens Health Connect.
 */
export function useGoogleHealthLink() {
  const [linked, setLinked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LINK_KEY);
        if (!cancelled) setLinked(raw === '1');
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (value: boolean) => {
    setLinked(value);
    try {
      await AsyncStorage.setItem(LINK_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const openHealthConnect = useCallback(async () => {
    const candidates =
      Platform.OS === 'android'
        ? [
            'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata',
            'https://play.google.com/store/apps/details?id=com.google.android.apps.fitness',
          ]
        : Platform.OS === 'ios'
          ? ['x-apple-health://', 'https://www.apple.com/ios/health/']
          : ['https://health.google/'];

    for (const url of candidates) {
      try {
        const can = await Linking.canOpenURL(url);
        if (can || url.startsWith('https://')) {
          await Linking.openURL(url);
          return;
        }
      } catch {
        /* try next */
      }
    }
  }, []);

  const connect = useCallback(async () => {
    await persist(true);
    Alert.alert(
      'Google Health linked',
      Platform.OS === 'android'
        ? 'Daryeel now auto-reads today’s steps from your phone sensors (same activity data Google Fit / Health Connect uses). You can also open Health Connect to manage permissions.'
        : Platform.OS === 'ios'
          ? 'Daryeel now auto-counts steps from Motion & Fitness. Open Apple Health if you want to review permissions.'
          : 'Automatic tracking is on for this browser when sensors are available.',
      [
        { text: 'Done', style: 'cancel' },
        {
          text: Platform.OS === 'ios' ? 'Open Health' : 'Open Health Connect',
          onPress: () => {
            void openHealthConnect();
          },
        },
      ],
    );
  }, [openHealthConnect, persist]);

  const disconnect = useCallback(async () => {
    await persist(false);
  }, [persist]);

  return {
    linked,
    ready,
    connect,
    disconnect,
    openHealthConnect,
  };
}
