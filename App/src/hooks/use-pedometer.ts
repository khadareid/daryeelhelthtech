import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'daryeel.pedometer.day';

type DaySnapshot = {
  date: string;
  steps: number;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Automatic step tracking via Expo Pedometer when the device supports it.
 * Falls back to stored / API seed values on web or unsupported devices.
 */
export function usePedometer(seedSteps = 0) {
  const [steps, setSteps] = useState(seedSteps);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [tracking, setTracking] = useState(false);

  const persist = useCallback(async (next: number) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: todayKey(), steps: next } satisfies DaySnapshot),
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let appSub: { remove: () => void } | undefined;

    (async () => {
      let stored = seedSteps;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DaySnapshot;
          if (parsed.date === todayKey()) stored = Number(parsed.steps) || seedSteps;
        }
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      setSteps(Math.max(stored, seedSteps));

      if (Platform.OS === 'web') {
        setAvailable(false);
        return;
      }

      try {
        const { Pedometer } = await import('expo-sensors');
        const isAvailable = await Pedometer.isAvailableAsync();
        if (cancelled) return;
        setAvailable(isAvailable);
        if (!isAvailable) return;

        const sync = async () => {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          try {
            const result = await Pedometer.getStepCountAsync(start, new Date());
            if (cancelled || typeof result?.steps !== 'number') return;
            setSteps((prev) => {
              const next = Math.max(prev, result.steps, seedSteps);
              void persist(next);
              return next;
            });
          } catch {
            /* some Android builds lack getStepCountAsync */
          }
        };

        setTracking(true);
        await sync();
        interval = setInterval(sync, 20_000);
        appSub = AppState.addEventListener('change', (state) => {
          if (state === 'active') void sync();
        });
      } catch {
        if (!cancelled) setAvailable(false);
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      appSub?.remove();
      setTracking(false);
    };
  }, [persist, seedSteps]);

  const setManualSteps = useCallback(
    (value: number) => {
      const next = Math.max(0, Math.floor(value));
      setSteps(next);
      void persist(next);
    },
    [persist],
  );

  return {
    steps,
    available,
    tracking,
    setManualSteps,
    caloriesFromSteps: Math.round(steps * 0.04),
  };
}
