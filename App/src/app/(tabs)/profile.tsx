import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { EnumChips, FieldLabel, formStyles } from '@/components/form-ui';
import { Screen } from '@/components/screen';
import { CardListSkeleton } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  changeMyPasswordRequest,
  listMedicationsRequest,
  updateMeRequest,
  upsertMedicalProfileRequest,
  type MedicationItem,
} from '@/lib/api';
import {
  BLOOD_TYPE_OPTIONS,
  enumLabel,
  GENDER_OPTIONS,
} from '@/lib/enums';

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
  { id: 'notifications', label: 'Alerts', href: '/(tabs)/notifications' },
  { id: 'doctors', label: 'Doctors', href: '/(tabs)/doctors' },
];

type Tab = 'account' | 'security';

function toDateInput(d?: string | null) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function ProfileScreen() {
  const { user, profile, logout, refreshProfile, apiOnline, accessToken } =
    useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [tab, setTab] = useState<Tab>('account');
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    image: '',
    gender: '',
    dateOfBirth: '',
    country: '',
    region: '',
    city: '',
    bloodType: 'UNKNOWN',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const photo = form.image || user?.avatarUrl || user?.picture;
  const gender = form.gender || user?.gender || profile?.gender;
  const healthId = profile?.healthId || user?.healthId;

  const syncForm = () => {
    setForm((prev) => ({
      ...prev,
      fullName: profile?.fullName || user?.fullName || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || user?.phone || '',
      image: profile?.avatarUrl || profile?.picture || user?.avatarUrl || '',
      gender: profile?.gender || user?.gender || '',
      dateOfBirth: toDateInput(profile?.dateOfBirth || user?.dateOfBirth),
      country: profile?.country || user?.country || '',
      region: profile?.region || user?.region || '',
      city: profile?.city || user?.city || '',
      bloodType: profile?.medicalProfile?.bloodType || 'UNKNOWN',
    }));
  };

  useEffect(() => {
    syncForm();
    setLoading(false);
  }, [profile, user]);

  useEffect(() => {
    if (!accessToken) return;
    listMedicationsRequest(accessToken)
      .then(setMeds)
      .catch(() => setMeds([]));
  }, [accessToken]);

  const onChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function onSaveProfile() {
    if (!accessToken) return;
    if (!form.fullName.trim()) {
      Alert.alert('Full name required', 'Enter your full name.');
      return;
    }
    setSaving(true);
    try {
      await updateMeRequest(
        {
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || null,
          gender: form.gender || null,
          dateOfBirth: form.dateOfBirth || null,
          avatarUrl: form.image.trim() || null,
          country: form.country.trim() || null,
          region: form.region.trim() || null,
          city: form.city.trim() || null,
        },
        accessToken,
      );
      await upsertMedicalProfileRequest(
        { bloodType: form.bloodType || 'UNKNOWN' },
        accessToken,
      );
      await refreshProfile();
      Alert.alert('Profile updated', 'Your My Profile details were saved.');
    } catch (error) {
      Alert.alert(
        'Could not update',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword() {
    if (!accessToken) return;
    if (form.newPassword.length < 6) {
      Alert.alert('Weak password', 'New password must be at least 6 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirm password must match.');
      return;
    }
    if (!form.currentPassword) {
      Alert.alert('Current password', 'Enter your current password.');
      return;
    }
    setChangingPw(true);
    try {
      await changeMyPasswordRequest(
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        accessToken,
      );
      setForm((p) => ({
        ...p,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      Alert.alert('Password updated', 'Use your new password next time you sign in.');
    } catch (error) {
      Alert.alert(
        'Could not change password',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setChangingPw(false);
    }
  }

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
          syncForm();
          if (accessToken) {
            setMeds(await listMedicationsRequest(accessToken).catch(() => []));
          }
        }}
        headerTitle="Profile">
        <View style={styles.hero}>
          <Text style={styles.brand}>Daryeel</Text>
          <Text style={styles.heroTitle}>My Profile</Text>
          <Text style={styles.heroSub}>
            Add or update your account and medical details
          </Text>
        </View>

        {loading ? <CardListSkeleton rows={2} /> : null}

        <View style={styles.header}>
          <UserAvatar
            name={form.fullName || user?.fullName}
            photo={photo}
            gender={gender}
            size={88}
          />
          <Text style={styles.name}>{form.fullName || 'Daryeel user'}</Text>
          <Text style={styles.email}>{form.email}</Text>
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

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab('account')}
            style={[styles.tab, tab === 'account' && styles.tabOn]}>
            <Text style={[styles.tabText, tab === 'account' && styles.tabTextOn]}>
              Account
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('security')}
            style={[styles.tab, tab === 'security' && styles.tabOn]}>
            <Text
              style={[styles.tabText, tab === 'security' && styles.tabTextOn]}>
              Security
            </Text>
          </Pressable>
        </View>

        {tab === 'account' ? (
          <View style={formStyles.form}>
            <Text style={formStyles.section}>Profile details</Text>
            <Text style={formStyles.sub}>
              Update how you appear on Daryeel — same as the website.
            </Text>

            <FieldLabel>Full name *</FieldLabel>
            <TextInput
              value={form.fullName}
              onChangeText={(v) => onChange('fullName', v)}
              placeholder="Your full name"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
            />

            <FieldLabel>Email</FieldLabel>
            <TextInput
              value={form.email}
              editable={false}
              style={[formStyles.input, styles.inputDisabled]}
            />

            <FieldLabel>Phone</FieldLabel>
            <TextInput
              value={form.phone}
              onChangeText={(v) => onChange('phone', v)}
              placeholder="+252…"
              keyboardType="phone-pad"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
            />

            <FieldLabel>Gender</FieldLabel>
            <EnumChips
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(v) => onChange('gender', v)}
            />

            <FieldLabel>Date of birth (YYYY-MM-DD)</FieldLabel>
            <TextInput
              value={form.dateOfBirth}
              onChangeText={(v) => onChange('dateOfBirth', v)}
              placeholder="1995-01-15"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
              autoCapitalize="none"
            />

            <FieldLabel>Blood type</FieldLabel>
            <EnumChips
              options={BLOOD_TYPE_OPTIONS}
              value={form.bloodType}
              onChange={(v) => onChange('bloodType', v)}
            />

            <FieldLabel>Country</FieldLabel>
            <TextInput
              value={form.country}
              onChangeText={(v) => onChange('country', v)}
              placeholder="Somalia"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
            />

            <FieldLabel>Region</FieldLabel>
            <TextInput
              value={form.region}
              onChangeText={(v) => onChange('region', v)}
              placeholder="Banaadir"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
            />

            <FieldLabel>City</FieldLabel>
            <TextInput
              value={form.city}
              onChangeText={(v) => onChange('city', v)}
              placeholder="Mogadishu"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
            />

            <FieldLabel>Avatar URL</FieldLabel>
            <TextInput
              value={form.image}
              onChangeText={(v) => onChange('image', v)}
              placeholder="https://…"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
              autoCapitalize="none"
            />

            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                Role · {enumLabel(user?.role || 'USER')}
              </Text>
              <Text style={styles.meta}>
                API · {apiOnline ? 'Connected' : 'Offline'}
              </Text>
            </View>

            <Button
              title={saving ? 'Saving…' : 'Save profile'}
              loading={saving}
              onPress={onSaveProfile}
              icon={
                <Ionicons name="save-outline" size={18} color={Brand.white} />
              }
            />
          </View>
        ) : (
          <View style={formStyles.form}>
            <Text style={formStyles.section}>Change password</Text>
            <Text style={formStyles.sub}>
              Keep your Daryeel account secure.
            </Text>

            <FieldLabel>Current password</FieldLabel>
            <TextInput
              value={form.currentPassword}
              onChangeText={(v) => onChange('currentPassword', v)}
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
            />

            <FieldLabel>New password</FieldLabel>
            <TextInput
              value={form.newPassword}
              onChangeText={(v) => onChange('newPassword', v)}
              secureTextEntry
              placeholder="At least 6 characters"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
            />

            <FieldLabel>Confirm password</FieldLabel>
            <TextInput
              value={form.confirmPassword}
              onChangeText={(v) => onChange('confirmPassword', v)}
              secureTextEntry
              placeholder="Repeat new password"
              placeholderTextColor={Brand.muted}
              style={formStyles.input}
            />

            <Button
              title={changingPw ? 'Updating…' : 'Update password'}
              loading={changingPw}
              onPress={onChangePassword}
              icon={
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={Brand.white}
                />
              }
            />
          </View>
        )}

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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Brand.white,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  tabOn: { backgroundColor: Brand.primary },
  tabText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.muted,
  },
  tabTextOn: { color: Brand.white },
  inputDisabled: { opacity: 0.65 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  meta: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.muted,
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
