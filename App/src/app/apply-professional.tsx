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
import { submitProfessionalApplicationRequest } from '@/lib/api';

const ROLES = ['DOCTOR', 'NURSE', 'MIDWIFE', 'LAB_TECH', 'PHARMACIST'] as const;

export default function ApplyProfessionalScreen() {
  const { accessToken, isAuthenticated } = useAuth();
  const [requestedRole, setRequestedRole] =
    useState<(typeof ROLES)[number]>('DOCTOR');
  const [licenseNumber, setLicense] = useState('');
  const [specialization, setSpec] = useState('');
  const [facilityName, setFacility] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!isAuthenticated || !accessToken) {
      Alert.alert('Sign in required', 'Please sign in to apply.', [
        { text: 'Sign in', onPress: () => router.push('/sign-in' as Href) },
      ]);
      return;
    }
    if (!licenseNumber.trim()) {
      Alert.alert('License required', 'Enter your license number.');
      return;
    }
    setLoading(true);
    try {
      await submitProfessionalApplicationRequest(
        {
          requestedRole,
          licenseNumber,
          specialization,
          facilityName,
          yearsOfExperience: 1,
        },
        accessToken,
      );
      Alert.alert(
        'Submitted',
        'A Super Admin will review your application. You will not get clinical privileges until approved.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert(
        'Failed',
        error instanceof Error ? error.message : 'Try again later.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen headerTitle="Apply as professional">
      <Text style={styles.title}>Healthcare professional application</Text>
      <Text style={styles.sub}>
        Clinical roles require Super Admin approval. You cannot self-assign
        DOCTOR or other professional roles.
      </Text>

      <Text style={styles.label}>Role</Text>
      <View style={styles.row}>
        {ROLES.map((role) => (
          <Pressable
            key={role}
            onPress={() => setRequestedRole(role)}
            style={[
              styles.chip,
              requestedRole === role && styles.chipActive,
            ]}>
            <Text
              style={[
                styles.chipText,
                requestedRole === role && styles.chipTextActive,
              ]}>
              {role.replace(/_/g, ' ')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>License number</Text>
      <TextInput
        style={styles.input}
        value={licenseNumber}
        onChangeText={setLicense}
        placeholder="License / registration"
      />
      <Text style={styles.label}>Specialization</Text>
      <TextInput
        style={styles.input}
        value={specialization}
        onChangeText={setSpec}
        placeholder="e.g. Cardiology"
      />
      <Text style={styles.label}>Facility</Text>
      <TextInput
        style={styles.input}
        value={facilityName}
        onChangeText={setFacility}
        placeholder="Hospital / clinic"
      />

      <Pressable
        style={[styles.submit, loading && { opacity: 0.6 }]}
        disabled={loading}
        onPress={onSubmit}>
        <Text style={styles.submitText}>
          {loading ? 'Submitting…' : 'Submit for review'}
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
    color: '#64748B',
    marginTop: 6,
    marginBottom: Spacing.three,
    lineHeight: 19,
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.dark,
    marginTop: Spacing.two,
    marginBottom: 6,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: Radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  chipText: { fontFamily: Fonts.medium, fontSize: 11, color: Brand.dark },
  chipTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    backgroundColor: '#fff',
  },
  submit: {
    marginTop: Spacing.four,
    backgroundColor: Brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
});
