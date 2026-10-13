import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  checkApiHealth,
  getProfileRequest,
  loginRequest,
  registerRequest,
  type AuthUser,
  type UserProfile,
} from '@/lib/api';
import { signInWithGoogle } from '@/lib/google-auth';
import { clearSession, loadSession, saveSession } from '@/lib/storage';

type AuthContextValue = {
  user: AuthUser | null;
  profile: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiOnline: boolean | null;
  signInGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshApiHealth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const loadProfile = useCallback(async (userId: string, token: string) => {
    try {
      const next = await getProfileRequest(userId, token);
      setProfile(next);
      setUser({
        userid: next.userid,
        email: next.email,
        fullName: next.fullName,
        role: next.role,
        phone: next.phone,
        picture: next.picture,
        avatarUrl: next.avatarUrl,
      });
    } catch {
      /* keep cached user if profile fetch fails */
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const [session, online] = await Promise.all([
        loadSession(),
        checkApiHealth(),
      ]);

      if (!active) return;

      if (session) {
        setUser(session.user);
        setAccessToken(session.accessToken);
        setRefreshToken(session.refreshToken);
        await loadProfile(session.user.userid, session.accessToken);
      }

      setApiOnline(online);
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [loadProfile]);

  const persist = useCallback(
    async (next: {
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }) => {
      setUser(next.user);
      setAccessToken(next.accessToken);
      setRefreshToken(next.refreshToken);
      await saveSession(next);
      await loadProfile(next.user.userid, next.accessToken);
    },
    [loadProfile],
  );

  const signInGoogle = useCallback(async () => {
    const result = await signInWithGoogle();
    await persist(result);
  }, [persist]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginRequest(email.trim(), password);
      await persist(result);
    },
    [persist],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
    }) => {
      const result = await registerRequest({
        email: input.email.trim(),
        password: input.password,
        fullName: input.fullName.trim(),
        phone: input.phone?.trim() || undefined,
      });
      await persist(result);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    setUser(null);
    setProfile(null);
    setAccessToken(null);
    setRefreshToken(null);
    await clearSession();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user || !accessToken) return;
    await loadProfile(user.userid, accessToken);
  }, [user, accessToken, loadProfile]);

  const refreshApiHealth = useCallback(async () => {
    setApiOnline(await checkApiHealth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      apiOnline,
      signInGoogle,
      login,
      register,
      logout,
      refreshProfile,
      refreshApiHealth,
    }),
    [
      user,
      profile,
      accessToken,
      isLoading,
      apiOnline,
      signInGoogle,
      login,
      register,
      logout,
      refreshProfile,
      refreshApiHealth,
      refreshToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
