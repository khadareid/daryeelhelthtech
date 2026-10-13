import { router, type Href } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/screen';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { changeRoleRequest } from '@/lib/api';

const ROLES = [
  'USER',
  'PATIENT',
  'DOCTOR',
  'NURSE',
  'MIDWIFE',
  'LAB_TECH',
  'PHARMACIST',
  'RECEPTIONIST',
] as const;

const CLINICAL = new Set([
  'DOCTOR',
  'NURSE',
  'MIDWIFE',
  'LAB_TECH',
  'PHARMACIST',
  'RECEPTIONIST',
]);

export default function ChangeRoleScreen() {
  const { accessToken, user, refreshProfile, isAuthenticated } = useAuth();
  const [role, setRole] = useState<(typeof ROLES)[number]>(
    ((user?.role as (typeof ROLES)[number]) || 'USER'),
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!isAuthenticated || !accessToken) {
      Alert.alert('Sign in required');
      router.push('/sign-in' as Href);
      return;
    }
    if (CLINICAL.has(role) && reason.trim().length < 10) {
      Alert.alert(
        'Reason required',
        'Explain why you need this clinical role (at least 10 characters).',
      );
      return;
    }
    setLoading(true);
    try {
      const res = await changeRoleRequest(
        { role, reason: reason.trim() || undefined },
        accessToken,
      );
      await refreshProfile();
      if (res.applicationPending) {
        Alert.alert(
          'Application submitted',
          res.message ||
            'Super Admin must approve before your role changes. Your current role stays the same.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          'Role updated',
          res.message || `You are now ${role.replace(/_/g, ' ')}.`,
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
      setReason('');
    } catch (error) {
      Alert.alert(
        'Failed',
        error instanceof Error ? error.message : 'Could not update role',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen headerTitle="Change role">
      <Text style={styles.title}>Choose your role</Text>
      <Text style={styles.sub}>
        Current: {(user?.role || 'USER').replace(/_/g, ' ')}. Patient/User
        updates now. Doctor and staff roles need a reason + admin approval.
      </Text>

      <View style={styles.chips}>
        {ROLES.map((item) => {
          const active = item === role;
          return (
            <Pressable
              key={item}
              onPress={() => setRole(item)}
              style={[styles.chip, active && styles.chipOn]}>
              <Text style={[styles.chipText, active && styles.chipTextOn]}>
                {item.replace(/_/g, ' ')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Reason</Text>
      <TextInput
        style={styles.input}
        multiline
        value={reason}
        onChangeText={setReason}
        placeholder="Why do you need this role?"
        placeholderTextColor={Brand.muted}
      />

      <Pressable
        style={[styles.btn, loading && { opacity: 0.6 }]}
        disabled={loading}
        onPress={onSubmit}>
        <Text style={styles.btnText}>
          {loading ? 'Submitting…' : 'Save role / apply'}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Brand.dark,
  },
  sub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
    marginTop: 6,
    marginBottom: Spacing.three,
    lineHeight: 19,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Brand.white,
  },
  chipOn: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  chipText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.dark,
  },
  chipTextOn: { color: '#fff' },
  label: {
    marginTop: Spacing.three,
    marginBottom: 6,
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.dark,
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.lg,
    padding: 12,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.dark,
    backgroundColor: Brand.white,
    textAlignVertical: 'top',
  },
  btn: {
    marginTop: Spacing.four,
    backgroundColor: Brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
});
