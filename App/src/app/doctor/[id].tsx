import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { TIME_SLOTS, type DoctorItem } from '@/constants/content';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useDoctors } from '@/hooks/use-doctors';
import { useTheme } from '@/hooks/use-theme';
import { createAppointmentRequest, getDoctorRequest } from '@/lib/api';

function nextDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  });
}

function slotToHours(slot: string): { h: number; m: number } {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return { h: 9, m: 0 };
  let h = Number(match[1]);
  const m = Number(match[2]);
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return { h, m };
}

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { doctors } = useDoctors();
  const { isAuthenticated, accessToken, refreshProfile } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [remoteDoctor, setRemoteDoctor] = useState<DoctorItem | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);

  const doctor = useMemo(() => {
    if (remoteDoctor) return remoteDoctor;
    return doctors.find((item) => item.id === id) ?? null;
  }, [doctors, id, remoteDoctor]);

  const days = useMemo(() => nextDays(7), []);
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState(TIME_SLOTS[1] || '08:20 AM');
  const [visitType, setVisitType] = useState<'In-Person' | 'Video Call'>(
    'In-Person',
  );
  const [booking, setBooking] = useState(false);

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
          <ActivityIndicator color={theme.primary} />
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

  async function onBook() {
    if (!doctor) return;
    const selected = doctor;

    if (!isAuthenticated || !accessToken) {
      requireAuth('book an appointment');
      return;
    }

    const day = days[dayIndex];
    const { h, m } = slotToHours(slot);
    const when = new Date(day);
    when.setHours(h, m, 0, 0);

    setBooking(true);
    try {
      const appt = await createAppointmentRequest(
        {
          doctorId: selected.id,
          scheduledAt: when.toISOString(),
          reason: `${visitType} visit`,
          notes: visitType,
          consultationFee: selected.fee || undefined,
          currency: selected.currency || 'USD',
        },
        accessToken,
      );
      await refreshProfile();
      const fee = Number(selected.fee || 0);
      const feeLine =
        fee > 0
          ? `Fee: ${selected.currency || 'USD'} ${fee.toFixed(2)} — pay with Zaad / eDahab from Visits or Payments`
          : 'Fee: Free — no payment needed';
      Alert.alert(
        'Request sent',
        `${selected.name}\n${when.toLocaleString()}\n${visitType}\n${feeLine}\nStatus: ${appt.status}\nCode: ${appt.appointmentCode || appt.id}`,
        [
          {
            text: 'My visits',
            onPress: () => router.push('/(tabs)/appointments' as Href),
          },
          {
            text: fee > 0 ? 'Payments' : 'OK',
            onPress: () =>
              fee > 0
                ? router.push('/health/payments' as Href)
                : router.back(),
          },
        ],
      );
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
          paddingBottom: insets.bottom + 16,
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
          <View style={styles.slots}>
            {TIME_SLOTS.map((item) => {
              const active = item === slot;
              return (
                <Pressable
                  key={item}
                  onPress={() => setSlot(item)}
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

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.actionRow}>
          <Pressable
            onPress={onCall}
            style={[styles.iconBtn, { borderColor: theme.border }]}>
            <Ionicons name="call" size={20} color={theme.primary} />
            <Text style={[styles.iconBtnText, { color: theme.brandDark }]}>
              Call
            </Text>
          </Pressable>
        </View>
        <View style={styles.bookRow}>
          <View style={styles.feeBlock}>
            <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>
              Visit fee
            </Text>
            <Text style={[styles.feeValue, { color: theme.brandDark }]}>
              {doctor.fee > 0 ? `$${doctor.fee}` : 'TBA'}
            </Text>
          </View>
          {booking ? (
            <ActivityIndicator color={theme.primary} style={{ flex: 1 }} />
          ) : (
            <Button
              title={`Book · ${slot}`}
              onPress={onBook}
              style={{ flex: 1 }}
            />
          )}
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
    gap: Spacing.three,
    backgroundColor: '#fff',
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtnText: { fontFamily: Fonts.medium, fontSize: 13 },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  feeBlock: { minWidth: 72 },
  feeLabel: { fontFamily: Fonts.regular, fontSize: 11 },
  feeValue: { fontFamily: Fonts.bold, fontSize: 20 },
});
