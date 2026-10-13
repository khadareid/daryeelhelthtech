import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthUser } from '@/lib/api';

const KEYS = {
  accessToken: 'daryeel.accessToken',
  refreshToken: 'daryeel.refreshToken',
  user: 'daryeel.user',
} as const;

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export async function saveSession(session: StoredSession) {
  await AsyncStorage.multiSet([
    [KEYS.accessToken, session.accessToken],
    [KEYS.refreshToken, session.refreshToken],
    [KEYS.user, JSON.stringify(session.user)],
  ]);
}

export async function loadSession(): Promise<StoredSession | null> {
  const pairs = await AsyncStorage.multiGet([
    KEYS.accessToken,
    KEYS.refreshToken,
    KEYS.user,
  ]);
  const map = Object.fromEntries(pairs);
  const accessToken = map[KEYS.accessToken];
  const refreshToken = map[KEYS.refreshToken];
  const rawUser = map[KEYS.user];

  if (!accessToken || !refreshToken || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as AuthUser;
    return { accessToken, refreshToken, user };
  } catch {
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.multiRemove([
    KEYS.accessToken,
    KEYS.refreshToken,
    KEYS.user,
  ]);
}
