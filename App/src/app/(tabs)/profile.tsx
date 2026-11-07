import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  listMedicationsRequest,
  type MedicationItem,
} from '@/lib/api';
import { enumLabel } from '@/lib/enums';

/** Same care sections as the web Actions sheet */
const MENU: { id: string; label: string; href: Href }[] = [
  { id: 'visits', label: 'Visits', href: '/(tabs)/appointments' },
  { id: 'payments', label: 'Payments', href: '/health/payments' },
  { id: 'health', label: 'Daily health', href: '/(tabs)/health' },
  { id: 'vitals', label: 'Vitals', href: '/health/vitals' },
  { id: 'medications', label: 'Medications', href: '/health/medications' },
  { id: 'allergies', label: 'Allergies', href: '/health/allergies' },
  { id: 'prescriptions', label: 'Prescriptions', href: '/health/prescriptions' },
  { id: 'records', label: 'Records', href: '/health/medical-records' },
  { id: 'family', label: 'Family', href: '/health/family' },
  { id: 'emergency', label: 'Emergency', href: '/health/emergency-card' },
  { id: 'notifications', label: 'Alerts', href: '/notifications' },
  { id: 'doctors', label: 'Doctors', href: '/(tabs)/doctors' },
];

export default function ProfileScreen() {
  const { user, profile, logout, refreshProfile, apiOnline, accessToken } =
    useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const photo = user?.avatarUrl || user?.picture;
  const healthId = profile?.healthId || user?.healthId;
  const bloodType = profile?.medicalProfile?.bloodType;

  useEffect(() => {
    if (!accessToken) return;
    listMedicationsRequest(accessToken)
      .then(setMeds)
      .catch(() => setMeds([]));
  }, [accessToken]);

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
      <Screen
        onRefresh={async () => {
          await refreshProfile();
          if (accessToken) {
            setMeds(await listMedicationsRequest(accessToken).catch(() => []));
          }
        }}
        headerTitle="Profile">
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
          {healthId ? (
            <Text style={styles.patientId}>Health ID · {healthId}</Text>
          ) : null}
        </View>

        <View style={styles.patientCard}>
          <Text style={styles.patientCardLabel}>Daryeel Health ID</Text>
          <Text style={styles.patientCardValue}>
            {healthId || 'Generating…'}
          </Text>
          <Text style={styles.patientCardHint}>
            Permanent personal health identity linked to your medical record.
          </Text>
        </View>

        <View style={styles.card}>
          <Row label="Phone" value={user?.phone || '—'} />
          <Row label="City" value={profile?.city || user?.city || '—'} />
          <Row label="Blood type" value={enumLabel(bloodType)} />
          <Row label="Gender" value={enumLabel(user?.gender)} />
          <Row label="Role" value={enumLabel(user?.role || 'USER')} />
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
            <Text style={styles.medDose}>
              No medications on your account yet.
            </Text>
          ) : (
            meds.slice(0, 4).map((med) => (
              <View key={med.id} style={styles.medRow}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDose}>
                  {[med.dosage, med.frequency].filter(Boolean).join(' · ') ||
                    'As prescribed'}
                </Text>
              </View>
            ))
          )}
        </View>

        <Button
          title="Log out"
          variant="danger"
          onPress={() => setLogoutOpen(true)}
          icon={
            <Ionicons name="log-out-outline" size={18} color={Brand.white} />
          }
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
  patientId: {
    marginTop: 8,
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.primary,
    letterSpacing: 0.3,
  },
  patientCard: {
    backgroundColor: Brand.light,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 4,
  },
  patientCardLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    color: Brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  patientCardValue: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Brand.dark,
    letterSpacing: 0.5,
  },
  patientCardHint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Brand.muted,
    marginTop: 2,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rowLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Brand.muted,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: Fonts.semibold,
    fontSize: 13,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  menuLabel: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Brand.dark,
  },
  meds: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  section: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Brand.dark,
    marginBottom: 4,
  },
  medRow: { gap: 2, marginBottom: 8 },
  medName: { fontFamily: Fonts.semibold, fontSize: 14, color: Brand.dark },
  medDose: { fontFamily: Fonts.regular, fontSize: 13, color: Brand.muted },
});
