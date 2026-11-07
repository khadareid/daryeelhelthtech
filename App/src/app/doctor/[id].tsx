import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailSkeleton } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { TIME_SLOTS, type DoctorItem } from '@/constants/content';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useDoctors } from '@/hooks/use-doctors';
import { useTheme } from '@/hooks/use-theme';
import { createAppointmentRequest, getDoctorRequest } from '@/lib/api';
import {
  combineDayAndSlot,
  firstAvailableSlot,
  isSlotInPast,
  nextBookingDays,
} from '@/lib/bookingSlots';

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { doctors } = useDoctors();
  const { isAuthenticated, accessToken, refreshProfile } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [remoteDoctor, setRemoteDoctor] = useState<DoctorItem | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);

  const doctor = useMemo(() => {
    if (remoteDoctor) return remoteDoctor;
    return doctors.find((item) => item.id === id) ?? null;
  }, [doctors, id, remoteDoctor]);

  const days = useMemo(() => nextBookingDays(7), []);
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState(
    () => firstAvailableSlot(days[0], TIME_SLOTS) || TIME_SLOTS[0],
  );
  const [visitType, setVisitType] = useState<'In-Person' | 'Video Call'>(
    'In-Person',
  );
  const [booking, setBooking] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const idTimer = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(idTimer);
  }, []);

  const selectedDay = days[dayIndex];
  const now = useMemo(() => new Date(nowTick), [nowTick]);
  const slotPast = isSlotInPast(selectedDay, slot, now);
  const availableSlots = useMemo(
    () => TIME_SLOTS.filter((s) => !isSlotInPast(selectedDay, s, now)),
    [selectedDay, now],
  );

  useEffect(() => {
    if (slotPast || !availableSlots.includes(slot)) {
      const next = firstAvailableSlot(selectedDay, TIME_SLOTS, now);
      if (next) setSlot(next);
    }
  }, [selectedDay, slotPast, availableSlots, slot, now]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoadingDoctor(true);
      try {
        const next = await getDoctorRequest(id, accessToken);
        if (active) setRemoteDoctor(next);
      } catch {
        /* fall back to list cache */
      } finally {
        if (active) setLoadingDoctor(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, accessToken]);

  if (!doctor) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        {loadingDoctor ? (
          <DetailSkeleton />
        ) : (
          <Text style={{ color: theme.textSecondary, fontFamily: Fonts.medium }}>
            Doctor not found.
          </Text>
        )}
      </View>
    );
  }

  function requireAuth(action: string) {
    Alert.alert('Sign in required', `Please sign in to ${action}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign in', onPress: () => router.push('/sign-in' as Href) },
    ]);
  }

  function goToVisits() {
    router.replace('/(tabs)/appointments' as Href);
  }

  async function onBook() {
    if (!doctor) return;
    const selected = doctor;

    if (!isAuthenticated || !accessToken) {
      requireAuth('book an appointment');
      return;
    }

    const when = combineDayAndSlot(days[dayIndex], slot);
    if (when.getTime() <= Date.now()) {
      Alert.alert(
        'Time passed',
        'That slot is no longer available. Pick a later time.',
      );
      return;
    }

    setBooking(true);
    try {
      const fee = Number(selected.fee || 0);
      const isFree = fee <= 0;
      const appt = await createAppointmentRequest(
        {
          doctorId: selected.id,
          scheduledAt: when.toISOString(),
          reason: `${visitType} visit`,
          notes: visitType,
          consultationFee: fee,
          currency: selected.currency || 'USD',
          paymentRequired: !isFree,
        },
        accessToken,
      );
      await refreshProfile();
      const payStatus = String(
        appt.paymentStatus || (isFree ? 'PAID' : 'PENDING'),
      );
      const feeLine = isFree
        ? 'Fee: Free ($0) · payment Paid'
        : `Fee: ${selected.currency || 'USD'} ${fee.toFixed(2)} · ${payStatus}`;
      Alert.alert(
        'Booking confirmed',
        `Visit with ${selected.name}.\n${when.toLocaleString()}\n${visitType}\n${feeLine}\nCode: ${appt.appointmentCode || appt.id}`,
        [{ text: 'My visits', onPress: goToVisits }],
      );
      goToVisits();
    } catch (error) {
      Alert.alert(
        'Request not confirmed',
        error instanceof Error
          ? error.message
          : "We couldn't complete your appointment request. Please try again.",
      );
    } finally {
      setBooking(false);
    }
  }

  function onCall() {
    const phone = siteConfig.supportPhone.replace(/\s/g, '');
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call unavailable', `Dial ${siteConfig.supportPhoneDisplay}`);
    });
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.background,
        },
      ]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Image source={doctor.image} style={styles.hero} contentFit="cover" />
        <View style={[styles.body, { maxWidth: width > 800 ? 720 : undefined }]}>
          <Text style={[styles.name, { color: theme.brandDark }]}>
            {doctor.name}
          </Text>
          <Text style={[styles.specialty, { color: theme.primary }]}>
            {doctor.specialty}
          </Text>

          <View
            style={[
              styles.clinicChip,
              {
                backgroundColor: theme.backgroundSelected,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.clinicText, { color: theme.brandDark }]}>
              {doctor.clinicName}
            </Text>
            <Text style={[styles.clinicMeta, { color: theme.textSecondary }]}>
              {doctor.city}
            </Text>
          </View>

          <View style={styles.stats}>
            <Stat
              label="Rating"
              value={doctor.rating > 0 ? doctor.rating.toFixed(1) : '—'}
              theme={theme}
            />
            <Stat
              label="Reviews"
              value={String(doctor.reviews)}
              theme={theme}
            />
            <Stat
              label="Years"
              value={
                doctor.experienceYears > 0
                  ? `${doctor.experienceYears}+`
                  : '—'
              }
              theme={theme}
            />
          </View>

          <Text style={[styles.section, { color: theme.brandDark }]}>About</Text>
          <Text style={[styles.about, { color: theme.textSecondary }]}>
            {doctor.bio}
          </Text>

          <Text style={[styles.section, { color: theme.brandDark }]}>
            Focus areas
          </Text>
          <View style={styles.tags}>
            {doctor.tags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  { backgroundColor: theme.backgroundSelected },
                ]}>
                <Text style={[styles.tagText, { color: theme.primary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          {doctor.reviewSamples && doctor.reviewSamples.length > 0 ? (
            <>
              <Text style={[styles.section, { color: theme.brandDark }]}>
                Patient ratings
              </Text>
              {doctor.reviewSamples.map((review) => (
                <View
                  key={review.id}
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}>
                  <View style={styles.reviewTop}>
                    <Text
                      style={[styles.reviewAuthor, { color: theme.brandDark }]}>
                      {review.author}
                    </Text>
                    <Text style={[styles.reviewStars, { color: '#EA580C' }]}>
                      ★ {review.rating.toFixed(1)}
                    </Text>
                  </View>
                  {review.comment ? (
                    <Text
                      style={[
                        styles.reviewBody,
                        { color: theme.textSecondary },
                      ]}>
                      {review.comment}
                    </Text>
                  ) : null}
                  {review.date ? (
                    <Text
                      style={[
                        styles.reviewDate,
                        { color: theme.textSecondary },
                      ]}>
                      {review.date}
                    </Text>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}

          <Text style={[styles.section, { color: theme.brandDark }]}>
            Select date
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.days}>
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
          </ScrollView>

          <Text style={[styles.section, { color: theme.brandDark }]}>
            Available time (every 20 min)
          </Text>
          {availableSlots.length === 0 ? (
            <Text style={[styles.about, { color: theme.textSecondary }]}>
              No times left today — pick another day.
            </Text>
          ) : null}
          <View style={styles.slots}>
            {TIME_SLOTS.map((item) => {
              const past = isSlotInPast(selectedDay, item, now);
              const active = item === slot && !past;
              return (
                <Pressable
                  key={item}
                  disabled={past}
                  onPress={() => setSlot(item)}
                  style={[
                    styles.slot,
                    {
                      backgroundColor: active
                        ? theme.primary
                        : theme.backgroundElement,
                      borderColor: active ? theme.primary : theme.border,
                      opacity: past ? 0.35 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.slotText,
                      {
                        color: active
                          ? '#FFFFFF'
                          : past
                            ? theme.textSecondary
                            : theme.brandDark,
                      },
                    ]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.section, { color: theme.brandDark }]}>
            Visit type
          </Text>
          <View style={styles.visitRow}>
            {(['In-Person', 'Video Call'] as const).map((item) => {
              const active = item === visitType;
              return (
                <Pressable
                  key={item}
                  onPress={() => setVisitType(item)}
                  style={[
                    styles.visit,
                    {
                      backgroundColor: active
                        ? theme.backgroundSelected
                        : theme.backgroundElement,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.visitText,
                      { color: active ? theme.primary : theme.textSecondary },
                    ]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: theme.backgroundElement,
          },
        ]}>
        <Text style={[styles.footerHint, { color: theme.textSecondary }]}>
          {days[dayIndex].toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}{' '}
          · {slot} · {visitType}
        </Text>
        <View style={styles.bookRow}>
          <Pressable
            onPress={onCall}
            style={[styles.iconBtn, { borderColor: theme.border }]}>
            <Ionicons name="call" size={20} color={theme.primary} />
          </Pressable>
          <View style={styles.feeBlock}>
            <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>
              Visit fee
            </Text>
            <Text
              style={[
                styles.feeValue,
                {
                  color:
                    Number(doctor.fee || 0) <= 0
                      ? theme.success
                      : theme.brandDark,
                },
              ]}>
              {Number(doctor.fee || 0) > 0
                ? `$${Number(doctor.fee).toFixed(2)}`
                : 'Free'}
            </Text>
            <Text style={[styles.feeHint, { color: theme.textSecondary }]}>
              {Number(doctor.fee || 0) <= 0 ? '$0 · no payment' : 'Pay after book'}
            </Text>
          </View>
          <Button
            title={
              availableSlots.length === 0
                ? 'No times left'
                : booking
                  ? 'Booking…'
                  : `Book · ${slot}`
            }
            onPress={onBook}
            loading={booking}
            disabled={booking || availableSlots.length === 0 || slotPast}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        styles.stat,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <Text style={[styles.statValue, { color: theme.brandDark }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingBottom: 24, alignItems: 'center' },
  hero: {
    width: '100%',
    height: 240,
  },
  body: {
    width: '100%',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  specialty: {
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  clinicChip: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: 2,
  },
  clinicText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  clinicMeta: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  stat: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  section: {
    marginTop: Spacing.two,
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  about: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  reviewCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewAuthor: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
  reviewStars: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  reviewBody: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewDate: {
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  days: { gap: 8 },
  day: {
    width: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayName: { fontFamily: Fonts.medium, fontSize: 11 },
  dayNum: { fontFamily: Fonts.bold, fontSize: 16, marginTop: 2 },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  slotText: { fontFamily: Fonts.medium, fontSize: 13 },
  visitRow: { flexDirection: 'row', gap: 10 },
  visit: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  visitText: { fontFamily: Fonts.semibold, fontSize: 13 },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
    backgroundColor: '#fff',
  },
  footerHint: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  iconBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  feeBlock: { minWidth: 78 },
  feeLabel: { fontFamily: Fonts.regular, fontSize: 11 },
  feeValue: { fontFamily: Fonts.bold, fontSize: 20 },
  feeHint: { fontFamily: Fonts.regular, fontSize: 10, marginTop: 1 },
});
