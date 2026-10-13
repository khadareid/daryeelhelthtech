import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const MENU: { id: string; label: string; href: Href }[] = [
  { id: 'appointments', label: 'My Appointments', href: '/(tabs)/appointments' },
  { id: 'health', label: 'Health Daily', href: '/(tabs)/health' },
  { id: 'doctors', label: 'Find Doctors', href: '/(tabs)/doctors' },
  { id: 'role', label: 'Change role', href: '/change-role' },
  { id: 'apply', label: 'Apply as professional', href: '/apply-professional' },
  { id: 'home', label: 'Home overview', href: '/(tabs)' },
];

export default function ProfileScreen() {
  const { user, profile, logout, refreshProfile, apiOnline } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const photo = user?.avatarUrl || user?.picture;
  const meds = (profile?.medications ?? []).map((med, index) => ({
    id: med.medicationid || String(index),
    name: med.name || 'Medication',
    dose:
      [med.dosage, med.instructions].filter(Boolean).join(' · ') ||
      'As prescribed',
  }));

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutOpen(false);
      router.replace('/onboarding');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <Screen onRefresh={refreshProfile} headerTitle="Profile">
        <View style={styles.hero}>
          <Text style={styles.brand}>Daryeel</Text>
          <Text style={styles.heroTitle}>My Profile</Text>
          <Text style={styles.heroSub}>Account, medical profile & settings</Text>
        </View>

        <View style={styles.header}>
          <Image
            source={
              photo ||
              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80'
            }
            style={styles.avatar}
            contentFit="cover"
          />
          <Text style={styles.name}>{user?.fullName || 'Daryeel user'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>
            {(user?.role || 'USER').replace(/_/g, ' ')}
          </Text>
        </View>

        <View style={styles.card}>
          <Row label="Health ID" value={profile?.profile?.healthId || '—'} />
          <Row label="Phone" value={user?.phone || '—'} />
          <Row label="City" value={profile?.profile?.city || '—'} />
          <Row
            label="Blood type"
            value={profile?.profile?.bloodType?.replace(/_/g, ' ') || '—'}
          />
          <Row label="API" value={apiOnline ? 'Connected' : 'Offline'} />
        </View>

        <View style={styles.menu}>
          {MENU.map((item) => (
            <Pressable
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.href)}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Brand.primary} />
            </Pressable>
          ))}
        </View>

        <View style={styles.meds}>
          <Text style={styles.section}>Medications</Text>
          {meds.length === 0 ? (
            <Text style={styles.medDose}>No medications on your account yet.</Text>
          ) : (
            meds.slice(0, 4).map((med) => (
              <View key={med.id} style={styles.medRow}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDose}>{med.dose}</Text>
              </View>
            ))
          )}
        </View>

        <Button
          title="Log out"
          variant="danger"
          onPress={() => setLogoutOpen(true)}
          icon={<Ionicons name="log-out-outline" size={18} color={Brand.white} />}
        />
      </Screen>

      <ConfirmSheet
        visible={logoutOpen}
        danger
        loading={loggingOut}
        title="Log out of Daryeel Health?"
        message="You’ll need to sign in again to book visits, view records, and sync your health data."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        onCancel={() => {
          if (!loggingOut) setLogoutOpen(false);
        }}
        onConfirm={() => {
          void confirmLogout();
        }}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Brand.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 4,
  },
  brand: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: Brand.dark,
  },
  heroSub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.two,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Brand.light,
    marginBottom: Spacing.two,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Brand.dark,
  },
  email: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.muted,
  },
  role: {
    marginTop: 6,
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.primary,
    backgroundColor: Brand.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  rowValue: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Brand.dark,
  },
  menu: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  menuLabel: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Brand.dark,
  },
  meds: {
    gap: Spacing.two,
  },
  section: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Brand.dark,
  },
  medRow: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: 2,
  },
  medName: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Brand.dark,
  },
  medDose: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Brand.muted,
  },
});
