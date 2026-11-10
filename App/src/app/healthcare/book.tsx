import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConfirmSheet } from '@/components/confirm-sheet';
import { StackScreen } from '@/components/stack-screen';
import { DetailSkeleton } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { TIME_SLOTS } from '@/constants/content';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  createHealthcareAppointment,
  getHealthcareAvailability,
  getHealthcareDoctor,
  getHealthcareHospital,
  healthcareDoctorName,
  healthcareHospitalName,
  type AppointmentItem,
  type HealthcareDoctor,
  type HealthcareHospital,
} from '@/lib/api';
import {
  combineDayAndSlot,
  firstAvailableSlot,
  isSlotInPast,
  nextBookingDays,
} from '@/lib/bookingSlots';
import { enumLabel } from '@/lib/enums';

function toDateKey(day: Date) {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

function slotLabelFromIso(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function normalizeSlots(
  raw: Array<string | { start?: string; time?: string; label?: string }> | undefined,
  day: Date,
) {
  if (!raw?.length) return [] as { label: string; iso: string }[];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        if (/^\d{1,2}:\d{2}/.test(item) && !item.includes('T')) {
          const when = combineDayAndSlot(day, item);
          return { label: item, iso: when.toISOString() };
        }
        const when = new Date(item);
        if (Number.isNaN(when.getTime())) return null;
        return { label: slotLabelFromIso(item), iso: when.toISOString() };
      }
      const start = item.start || item.time || item.label;
      if (!start) return null;
      if (/^\d{1,2}:\d{2}/.test(start) && !String(start).includes('T')) {
        const when = combineDayAndSlot(day, start);
        return { label: start, iso: when.toISOString() };
      }
      const when = new Date(start);
      if (Number.isNaN(when.getTime())) return null;
      return { label: slotLabelFromIso(String(start)), iso: when.toISOString() };
    })
    .filter(Boolean) as { label: string; iso: string }[];
}

export default function HealthcareBookScreen() {
  const params = useLocalSearchParams<{
    hospitalId?: string;
    doctorId?: string;
  }>();
  const hospitalId = String(params.hospitalId || '');
  const doctorId = String(params.doctorId || '');
  const theme = useTheme();
  const { accessToken, isAuthenticated, refreshProfile } = useAuth();

  const days = useMemo(() => nextBookingDays(7), []);
  const [dayIndex, setDayIndex] = useState(0);
  const [hospital, setHospital] = useState<HealthcareHospital | null>(null);
  const [doctor, setDoctor] = useState<HealthcareDoctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<{ label: string; iso: string }[]>([]);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [consent, setConsent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [created, setCreated] = useState<AppointmentItem | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const selectedDay = days[dayIndex];
  const now = useMemo(() => new Date(nowTick), [nowTick]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const loadEntities = useCallback(async () => {
    if (!hospitalId || !doctorId) return;
    setLoading(true);
    try {
      const [h, d] = await Promise.all([
        getHealthcareHospital(hospitalId, accessToken),
        getHealthcareDoctor(doctorId, accessToken),
      ]);
      setHospital(h);
      setDoctor(d);
    } catch {
      setHospital(null);
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, doctorId, hospitalId]);

  const loadAvailability = useCallback(async () => {
    if (!doctorId) return;
    const date = toDateKey(selectedDay);
    try {
      const avail = await getHealthcareAvailability(
        doctorId,
        date,
        accessToken,
      );
      const live = normalizeSlots(avail.slots, selectedDay).filter(
        (s) => new Date(s.iso).getTime() > now.getTime(),
      );
      if (live.length) {
        setSlots(live);
        setSlotIso(live[0].iso);
        return;
      }
    } catch {
      /* fall back to local slots */
    }

    const fallback = TIME_SLOTS.filter(
      (s) => !isSlotInPast(selectedDay, s, now),
    ).map((label) => ({
      label,
      iso: combineDayAndSlot(selectedDay, label).toISOString(),
    }));
    setSlots(fallback);
    const first = firstAvailableSlot(selectedDay, TIME_SLOTS, now);
    setSlotIso(
      first
        ? combineDayAndSlot(selectedDay, first).toISOString()
        : fallback[0]?.iso || null,
    );
  }, [accessToken, doctorId, now, selectedDay]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  function requireAuth() {
    Alert.alert('Sign in required', 'Please sign in to book a hospital visit.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign in', onPress: () => router.push('/sign-in' as Href) },
    ]);
  }

  async function submitBooking() {
    if (!hospital || !doctor || !slotIso) return;
    if (!isAuthenticated || !accessToken) {
      requireAuth();
      return;
    }
    if (!consent) {
      Alert.alert(
        'Consent required',
        'Please consent to share your booking details with the hospital.',
      );
      return;
    }

    const when = new Date(slotIso);
    if (when.getTime() <= Date.now()) {
      Alert.alert('Time passed', 'Pick a later slot.');
      return;
    }

    setBooking(true);
    try {
      const fee = Number(doctor.consultationFee ?? 0);
      const appt = await createHealthcareAppointment(
        {
          hospitalId,
          tenantId: hospitalId,
          doctorId,
          scheduledAt: when.toISOString(),
          reason: reason.trim() || 'Hospital visit request',
          consentGranted: true,
          consultationFee: fee || null,
          currency: doctor.currency || 'USD',
          doctorName: healthcareDoctorName(doctor),
          facilityName: healthcareHospitalName(hospital),
          specialty:
            doctor.specialization || doctor.specialty || undefined,
          facilityId: doctor.facilityId || undefined,
          department: doctor.department?.name || doctor.facilityName || undefined,
          type: 'IN_PERSON',
        },
        accessToken,
      );
      setCreated(appt);
      setConfirmOpen(false);
      await refreshProfile();
    } catch (error) {
      Alert.alert(
        'Request not confirmed',
        error instanceof Error
          ? error.message
          : 'Could not send your hospital booking request.',
      );
    } finally {
      setBooking(false);
    }
  }

  if (loading && !doctor) {
    return (
      <StackScreen title="Hospital booking" showHeader={false}>
        <DetailSkeleton />
      </StackScreen>
    );
  }

  if (!hospital || !doctor) {
    return (
      <StackScreen title="Hospital booking" showHeader={false}>
        <View style={styles.missing}>
          <Text style={{ color: theme.textSecondary, fontFamily: Fonts.medium }}>
            Doctor or hospital not found.
          </Text>
        </View>
      </StackScreen>
    );
  }

  if (created) {
    return (
      <StackScreen title="Request sent" showHeader={false}>
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <View style={[styles.statusIcon, { backgroundColor: Brand.light }]}>
            <Ionicons name="checkmark-circle" size={32} color={Brand.primary} />
          </View>
          <Text style={[styles.statusTitle, { color: theme.brandDark }]}>
            Request sent
          </Text>
          <Text style={[styles.statusBody, { color: theme.textSecondary }]}>
            {healthcareHospitalName(hospital)} will review your visit with{' '}
            {healthcareDoctorName(doctor)}.
          </Text>
          <View style={styles.statusRows}>
            <StatusRow
              label="Status"
              value={enumLabel(created.status)}
              theme={theme}
            />
            <StatusRow
              label="When"
              value={new Date(created.scheduledAt).toLocaleString()}
              theme={theme}
            />
            <StatusRow
              label="Code"
              value={created.appointmentCode || created.id}
              theme={theme}
            />
            {created.externalTicketNumber ? (
              <StatusRow
                label="OPD"
                value={created.externalTicketNumber}
                theme={theme}
              />
            ) : (
              <StatusRow
                label="OPD"
                value="Issued after hospital confirms"
                theme={theme}
              />
            )}
          </View>
          <Button
            title="View my visits"
            onPress={() => router.replace('/(tabs)/appointments' as Href)}
          />
          <Button
            title="Back to hospitals"
            variant="outline"
            onPress={() => router.replace('/healthcare' as Href)}
          />
        </View>
      </StackScreen>
    );
  }

  const doctorName = healthcareDoctorName(doctor);
  const hospitalName = healthcareHospitalName(hospital);
  const specialty =
    doctor.specialization || doctor.specialty || doctor.department?.name;

  return (
    <StackScreen
      title="Hospital booking"
      showHeader={false}
      onRefresh={loadAvailability}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.title, { color: theme.brandDark }]}>
          {doctorName}
        </Text>
        {specialty ? (
          <Text style={[styles.specialty, { color: theme.primary }]}>
            {specialty}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {hospitalName}
        </Text>
      </View>

      <Text style={[styles.section, { color: theme.brandDark }]}>
        Select date
      </Text>
      <View style={styles.days}>
        {days.map((date, index) => {
          const active = index === dayIndex;
          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => setDayIndex(index)}
              style={[
                styles.day,
                {
                  backgroundColor: active
                    ? theme.primary
                    : theme.backgroundElement,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.dayName,
                  { color: active ? '#FFFFFF' : theme.textSecondary },
                ]}>
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  { color: active ? '#FFFFFF' : theme.brandDark },
                ]}>
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.section, { color: theme.brandDark }]}>
        Available time
      </Text>
      {slots.length === 0 ? (
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          No times left today — pick another day.
        </Text>
      ) : null}
      <View style={styles.slots}>
        {slots.map((item) => {
          const active = item.iso === slotIso;
          return (
            <Pressable
              key={item.iso}
              onPress={() => setSlotIso(item.iso)}
              style={[
                styles.slot,
                {
                  backgroundColor: active
                    ? theme.primary
                    : theme.backgroundElement,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.slotText,
                  { color: active ? '#FFFFFF' : theme.brandDark },
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.section, { color: theme.brandDark }]}>
        Reason (optional)
      </Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="Why are you visiting?"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: theme.brandDark,
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      />

      <Pressable
        onPress={() => setConsent((v) => !v)}
        style={[
          styles.consent,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: consent ? theme.primary : theme.border,
          },
        ]}>
        <Ionicons
          name={consent ? 'checkbox' : 'square-outline'}
          size={22}
          color={consent ? theme.primary : theme.textSecondary}
        />
        <Text style={[styles.consentText, { color: theme.brandDark }]}>
          I consent to share my booking and contact details with{' '}
          {hospitalName} so they can confirm this visit and issue an OPD ticket.
        </Text>
      </Pressable>

      <Button
        title={
          !slots.length
            ? 'No times left'
            : booking
              ? 'Sending…'
              : 'Request appointment'
        }
        disabled={!slots.length || !slotIso || booking}
        loading={booking}
        onPress={() => {
          if (!isAuthenticated || !accessToken) {
            requireAuth();
            return;
          }
          if (!consent) {
            Alert.alert(
              'Consent required',
              'Please consent to share your booking details with the hospital.',
            );
            return;
          }
          setConfirmOpen(true);
        }}
      />

      <ConfirmSheet
        visible={confirmOpen}
        title="Send hospital request?"
        message={`Request a visit with ${doctorName} at ${hospitalName} on ${
          slotIso ? new Date(slotIso).toLocaleString() : '—'
        }. The hospital must confirm before an OPD ticket is issued.`}
        confirmLabel="Send request"
        loading={booking}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={submitBooking}
      />
    </StackScreen>
  );
}

function StatusRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.statusRow}>
      <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statusValue, { color: theme.brandDark }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: 4,
  },
  title: { fontFamily: Fonts.bold, fontSize: 22 },
  specialty: { fontFamily: Fonts.medium, fontSize: 14 },
  meta: { fontFamily: Fonts.regular, fontSize: 13 },
  section: {
    marginTop: Spacing.two,
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: {
    width: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayName: { fontFamily: Fonts.medium, fontSize: 11 },
  dayNum: { fontFamily: Fonts.bold, fontSize: 16, marginTop: 2 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  slotText: { fontFamily: Fonts.medium, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  consent: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    alignItems: 'flex-start',
  },
  consentText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: { fontFamily: Fonts.bold, fontSize: 22 },
  statusBody: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  statusRows: { gap: 10 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusLabel: { fontFamily: Fonts.medium, fontSize: 13 },
  statusValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
});
