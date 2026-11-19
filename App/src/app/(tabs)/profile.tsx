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
import { HospitalRequestsCard } from '@/components/hospital-requests-card';
import { LocationSelect } from '@/components/location-select';
import { PhoneField } from '@/components/phone-field';
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
import {
  citiesForRegion,
  countryNames,
  hasRegionData,
  regionsForCountry,
  withCurrentOption,
} from '@/lib/locations';
import {
  formatPhoneDisplay,
  isValidPhone,
  normalizePhone,
} from '@/lib/phone';

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

function maskHealthId(id: string) {
  if (id.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(10, id.length - 4))}${id.slice(-4)}`;
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
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('+252');
  const [healthIdVisible, setHealthIdVisible] = useState(false);

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
    const phone = profile?.phone || user?.phone || '';
    setForm((prev) => ({
      ...prev,
      fullName: profile?.fullName || user?.fullName || '',
      email: profile?.email || user?.email || '',
      phone,
      image: profile?.avatarUrl || profile?.picture || user?.avatarUrl || '',
      gender: profile?.gender || user?.gender || '',
      dateOfBirth: toDateInput(profile?.dateOfBirth || user?.dateOfBirth),
      country: profile?.country || user?.country || 'Somaliland',
      region: profile?.region || user?.region || '',
      city: profile?.city || user?.city || '',
      bloodType: profile?.medicalProfile?.bloodType || 'UNKNOWN',
    }));
    setPhoneDraft(phone || '+252');
    setPhoneEditing(!phone);
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
    const phoneValue = phoneEditing || !form.phone ? phoneDraft : form.phone;
    if (!phoneValue.trim() || !isValidPhone(phoneValue)) {
      Alert.alert(
        'Phone required',
        'Enter a valid phone number, e.g. +252 63 XXX XXXX',
      );
      return;
    }
    setSaving(true);
    try {
      await updateMeRequest(
        {
          fullName: form.fullName.trim(),
          phone: normalizePhone(phoneValue),
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
      setPhoneEditing(false);
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
      router.replace('/(tabs)' as Href);
    } finally {
      setLoggingOut(false);
    }
  }

  if (!accessToken) {
    return (
      <Screen headerTitle="Profile">
        <View style={styles.hero}>
          <Text style={styles.brand}>Daryeel</Text>
          <Text style={styles.heroTitle}>Welcome</Text>
          <Text style={styles.heroSub}>
            Browse doctors and the home feed freely. Sign in when you are ready
            to book or save your health record.
          </Text>
        </View>
        <View style={styles.guestCard}>
          <UserAvatar name="Guest" size={72} />
          <Text style={styles.name}>Browsing as guest</Text>
          <Text style={styles.email}>
            Create an account to book visits and keep your medical profile.
          </Text>
          <View style={styles.guestActions}>
            <Button
              title="Sign In"
              onPress={() => router.push('/sign-in')}
              style={styles.guestBtn}
            />
            <Button
              title="Sign Up"
              variant="ghost"
              onPress={() => router.push('/sign-up')}
              style={styles.guestBtn}
            />
          </View>
          <Button
            title="Explore doctors"
            variant="ghost"
            onPress={() => router.push('/(tabs)/doctors')}
          />
        </View>
      </Screen>
    );
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
            <Pressable
              onPress={() => setHealthIdVisible((v) => !v)}
              style={styles.patientIdRow}
              accessibilityRole="button"
              accessibilityLabel={
                healthIdVisible ? 'Hide Health ID' : 'Show Health ID'
              }>
              <Text style={styles.patientId}>
                Health ID ·{' '}
                {healthIdVisible ? healthId : maskHealthId(healthId)}
              </Text>
              <Ionicons
                name={healthIdVisible ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={Brand.primary}
              />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.patientCard}>
          <View style={styles.patientCardTop}>
            <Text style={styles.patientCardLabel}>Daryeel Health ID</Text>
            {healthId ? (
              <Pressable
                onPress={() => setHealthIdVisible((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  healthIdVisible ? 'Hide Health ID' : 'Show Health ID'
                }>
                <Ionicons
                  name={healthIdVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Brand.primary}
                />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.patientCardValue}>
            {healthId
              ? healthIdVisible
                ? healthId
                : maskHealthId(healthId)
              : 'Generating…'}
          </Text>
          <Text style={styles.patientCardHint}>
            Permanent personal health identity linked to your medical record.
            Hospitals find you with this ID on Daryeel SaaS.
          </Text>
        </View>

        <HospitalRequestsCard accessToken={accessToken} />

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

            <FieldLabel>Phone Number *</FieldLabel>
            {form.phone && !phoneEditing ? (
              <View style={styles.phoneBox}>
                <Text style={styles.phoneValue}>
                  {formatPhoneDisplay(form.phone)}
                </Text>
                <Pressable
                  onPress={() => {
                    setPhoneDraft(form.phone || '+252');
                    setPhoneEditing(true);
                  }}>
                  <Text style={styles.phoneAction}>Change number</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {!form.phone ? (
                  <Text style={styles.phoneAction}>Add phone number</Text>
                ) : null}
                <PhoneField value={phoneDraft} onChange={setPhoneDraft} />
                {form.phone ? (
                  <Pressable
                    onPress={() => {
                      setPhoneDraft(form.phone);
                      setPhoneEditing(false);
                    }}>
                    <Text style={styles.phoneCancel}>Cancel</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

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

            <LocationSelect
              label="Country"
              value={form.country}
              options={withCurrentOption(countryNames(), form.country)}
              placeholder="Search country…"
              searchPlaceholder="Type to filter countries…"
              searchable
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  country: v,
                  region: '',
                  city: '',
                }))
              }
            />

            {hasRegionData(form.country) ? (
              <>
                <LocationSelect
                  label="Region"
                  value={form.region}
                  options={withCurrentOption(
                    regionsForCountry(form.country),
                    form.region,
                  )}
                  placeholder="Select region"
                  onChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      region: v,
                      city: '',
                    }))
                  }
                />

                <LocationSelect
                  label="City"
                  value={form.city}
                  options={withCurrentOption(
                    citiesForRegion(form.country, form.region),
                    form.city,
                  )}
                  placeholder={
                    form.region ? 'Select city' : 'Select region first'
                  }
                  disabled={!form.region}
                  onChange={(v) => onChange('city', v)}
                />
              </>
            ) : (
              <>
                <FieldLabel>Region</FieldLabel>
                <TextInput
                  value={form.region}
                  onChangeText={(v) => onChange('region', v)}
                  placeholder="Region / state"
                  placeholderTextColor={Brand.muted}
                  style={formStyles.input}
                />
                <FieldLabel>City</FieldLabel>
                <TextInput
                  value={form.city}
                  onChangeText={(v) => onChange('city', v)}
                  placeholder="City"
                  placeholderTextColor={Brand.muted}
                  style={formStyles.input}
                />
              </>
            )}

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
  guestCard: {
    marginTop: Spacing.four,
    backgroundColor: Brand.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  guestActions: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  guestBtn: {
    width: '100%',
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
  phoneBox: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    backgroundColor: Brand.white,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: 8,
  },
  phoneValue: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Brand.dark,
  },
  phoneAction: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.primary,
  },
  phoneCancel: {
    fontFamily: Fonts.medium,
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
  patientIdRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientId: {
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
  patientCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
