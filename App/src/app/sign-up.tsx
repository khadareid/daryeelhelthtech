import { Redirect, router } from 'expo-router';
import { useState } from 'react';
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

export default function SignUpScreen() {
  const { register, signInGoogle, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  async function onRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Name, email, and password are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      await register({
        fullName,
        email,
        password,
        phone: phone.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Sign up failed',
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
        'Google sign-up',
        error instanceof Error ? error.message : 'Could not continue with Google.',
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join Daryeel Health in under a minute">
      <AuthField
        placeholder="Full name"
        autoComplete="name"
        value={fullName}
        onChangeText={setFullName}
      />
      <AuthField
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <AuthField
        placeholder="Phone (optional)"
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
      />
      <AuthField
        placeholder="Password"
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        right={
          <Pressable onPress={() => setShowPassword((v) => !v)}>
            <Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        }
      />

      <Button title="Sign Up" loading={loading} onPress={onRegister} />

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
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable onPress={() => router.replace('/sign-in')}>
          <Text style={styles.footerLink}>Sign In</Text>
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
