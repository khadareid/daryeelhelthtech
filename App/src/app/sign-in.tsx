import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthField, AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const REMEMBER_EMAIL_KEY = 'daryeel_remember_email';
const REMEMBER_FLAG_KEY = 'daryeel_remember_me';

export default function SignInScreen() {
  const { login, signInGoogle, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [savedEmail, flag] = await Promise.all([
          AsyncStorage.getItem(REMEMBER_EMAIL_KEY),
          AsyncStorage.getItem(REMEMBER_FLAG_KEY),
        ]);
        if (!alive) return;
        if (flag === '0') setRememberMe(false);
        if (savedEmail) setEmail(savedEmail);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  async function onLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Email and password are required.');
      return;
    }
    try {
      setLoading(true);
      await AsyncStorage.setItem(REMEMBER_FLAG_KEY, rememberMe ? '1' : '0');
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Sign in failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    try {
      setGoogleLoading(true);
      await signInGoogle();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Google sign-in',
        error instanceof Error ? error.message : 'Could not sign in with Google.',
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell title="Sign in to continue" subtitle="Welcome back to Daryeel Health">
      <AuthField
        placeholder="Email or Phone"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <AuthField
        placeholder="Password"
        secureTextEntry={!showPassword}
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        right={
          <Pressable onPress={() => setShowPassword((v) => !v)}>
            <Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        }
      />

      <View style={styles.rememberRow}>
        <Pressable
          style={styles.rememberLeft}
          onPress={() => setRememberMe((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
            {rememberMe ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>
        <Pressable style={styles.forgotWrap}>
          <Text style={styles.forgot}>Forget password?</Text>
        </Pressable>
      </View>

      <Button title="Login" loading={loading} onPress={onLogin} />

      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.or}>or continue with</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.socialRow}>
        <Pressable
          style={[styles.socialBtn, googleLoading && styles.socialDisabled]}
          disabled={googleLoading}
          onPress={onGoogle}>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.socialText}>
            {googleLoading ? 'Opening…' : 'Google'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don&apos;t have an account? </Text>
        <Pressable onPress={() => router.push('/sign-up')}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  toggle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.primary,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Brand.border,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  checkMark: {
    color: Brand.white,
    fontSize: 12,
    fontFamily: Fonts.bold,
    lineHeight: 14,
  },
  rememberText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Brand.dark,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
  },
  forgot: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Brand.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Brand.border,
  },
  or: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Brand.muted,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialBtn: {
    minWidth: 160,
    minHeight: 52,
    borderRadius: Radius.full,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  socialDisabled: {
    opacity: 0.6,
  },
  googleG: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: '#EA4335',
  },
  socialText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Brand.dark,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.muted,
  },
  footerLink: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Brand.primary,
  },
});
