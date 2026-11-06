import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { DoctorListCard } from '@/components/doctor-list-card';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '@/constants/content';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useDoctors } from '@/hooks/use-doctors';
import { useTheme } from '@/hooks/use-theme';
import {
  getTodayHealthLog,
  listAppointmentsRequest,
  listMedicationsRequest,
  type AppointmentItem,
  type MedicationItem,
} from '@/lib/api';

const DEFAULT_STEPS_GOAL = 10000;
const DEFAULT_WATER_GOAL = 2000;
const DEFAULT_SLEEP_GOAL = 8;

type TodayLog = {
  mood?: string | null;
  steps?: number | null;
  waterIntakeMl?: number | null;
  sleepHours?: number | null;
};

/** Mirrors Website CareHome SERVICES */
const HEALTH_LINKS: { id: string; title: string; desc: string; href: Href }[] =
  [
    {
      id: 'doctors',
      title: 'Doctors',
      desc: 'Book a clinician',
      href: '/(tabs)/doctors',
    },
    {
      id: 'vitals',
      title: 'Vitals',
      desc: 'Log BP & HR',
      href: '/health/vitals',
    },
    {
      id: 'health',
      title: 'Health',
      desc: 'Daily log',
      href: '/(tabs)/health',
    },
    {
      id: 'visits',
      title: 'Visits',
      desc: 'Book & confirm',
      href: '/(tabs)/appointments',
    },
    {
      id: 'payments',
      title: 'Payments',
      desc: 'Free or pay fee',
      href: '/health/payments',
    },
    {
      id: 'records',
      title: 'Records',
      desc: 'Visits, labs, docs',
      href: '/health/medical-records',
    },
    {
      id: 'emergency',
      title: 'Emergency',
      desc: 'Card & contacts',
      href: '/health/emergency-card',
    },
    {
      id: 'family',
      title: 'Family',
      desc: 'Members & phone',
      href: '/health/family',
    },
  ];

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function progress(value: number, goal: number) {
  return Math.max(0.08, Math.min(1, value / goal));
}

export default function HomeScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { user, profile, accessToken, refreshProfile, apiOnline } = useAuth();
  const { doctors, refresh } = useDoctors();
  const [todayLog, setTodayLog] = useState<TodayLog | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const serviceWidth = width < 380 ? '100%' : '48%';

  const firstName = (user?.fullName || 'there').split(' ')[0];
  const photo = user?.avatarUrl || user?.picture;
  const healthId = profile?.healthId || user?.healthId;
  const liveAppointment = appointments[0];

  const daily = {
    steps: todayLog?.steps ?? 0,
    waterMl: todayLog?.waterIntakeMl ?? 0,
    sleepHours: todayLog?.sleepHours ?? 0,
    mood: todayLog?.mood ?? '—',
  };

  async function loadExtras() {
    if (!accessToken) return;
    const [logRes, appts, meds] = await Promise.all([
      getTodayHealthLog(accessToken),
      listAppointmentsRequest(accessToken).catch(() => []),
      listMedicationsRequest(accessToken).catch(() => []),
    ]);
    setTodayLog((logRes?.result as TodayLog | null) ?? null);
    setAppointments(appts);
    setMedications(meds.filter((m) => m.isActive !== false));
  }

  async function onRefresh() {
    await Promise.all([refreshProfile(), refresh(), loadExtras()]);
  }

  useEffect(() => {
    loadExtras();
  }, [accessToken]);

  return (
    <Screen onRefresh={onRefresh} headerTitle="Home">
      <View
        style={[
          styles.greetCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Pressable onPress={() => router.push('/(tabs)/profile')}>
          <Image
            source={
              photo ||
              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80'
            }
            style={styles.avatar}
            contentFit="cover"
          />
        </Pressable>
        <View style={styles.greetWrap}>
          <Text style={[styles.hello, { color: theme.brandDark }]}>
            {greetingForNow()}, {firstName}
          </Text>
          <Text style={[styles.ready, { color: theme.textSecondary }]}>
            Your care home · {apiOnline ? 'Connected' : 'Offline'}
          </Text>
          {healthId ? (
            <Text style={styles.patientId}>Health ID · {healthId}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={styles.bell}>
          <Text style={{ color: theme.primary, fontSize: 18 }}>🔔</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <TextInput
          placeholder="Search doctors, specialty, city..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          onFocus={() => router.push('/(tabs)/doctors')}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.brandDark }]}>
        Care tools
      </Text>
      <View style={styles.servicesGrid}>
        {HEALTH_LINKS.map((service) => (
          <Pressable
            key={service.id}
            style={[
              styles.serviceCard,
              {
                width: serviceWidth,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push(service.href)}>
            <Text style={[styles.serviceTitle, { color: theme.brandDark }]}>
              {service.title}
            </Text>
            <Text style={[styles.serviceDesc, { color: theme.textSecondary }]}>
              {service.desc}
            </Text>
          </Pressable>
        ))}
      </View>

      <LinearGradient
        colors={[theme.primary, '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promo}>
        <Text style={styles.promoTitle}>Better care, closer to home</Text>
        <Text style={styles.promoText}>
          Book clinicians, track daily wellness, and keep your medical record in
          one place.
        </Text>
        <Button
          title="Explore doctors"
          variant="white"
          style={styles.promoBtn}
          onPress={() => router.push('/(tabs)/doctors')}
        />
      </LinearGradient>

      <SectionHeader
        title="Activity"
        action="Open"
        onAction={() => router.push('/(tabs)/health')}
        theme={theme}
      />
      <Pressable
        onPress={() => router.push('/(tabs)/health')}
        style={[
          styles.dailyCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <View
          style={{
            backgroundColor: theme.primary,
            borderRadius: 20,
            padding: 16,
            marginBottom: 12,
          }}>
          <Text
            style={{
              color: '#fff',
              fontFamily: Fonts.semibold,
              fontSize: 13,
              marginBottom: 6,
            }}>
            Walk · today
          </Text>
          <Text
            style={{
              color: '#fff',
              fontFamily: Fonts.bold,
              fontSize: 28,
            }}>
            {Number(daily.steps).toLocaleString()}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 12,
              marginTop: 2,
            }}>
            of {DEFAULT_STEPS_GOAL.toLocaleString()} goal
          </Text>
        </View>
        <DailyBar
          label="Water"
          value={`${daily.waterMl} / ${DEFAULT_WATER_GOAL} ml`}
          ratio={progress(Number(daily.waterMl), DEFAULT_WATER_GOAL)}
          theme={theme}
        />
        <DailyBar
          label="Sleep"
          value={`${daily.sleepHours} / ${DEFAULT_SLEEP_GOAL} h`}
          ratio={progress(Number(daily.sleepHours), DEFAULT_SLEEP_GOAL)}
          theme={theme}
        />
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          Mood · {String(daily.mood)}
        </Text>
      </Pressable>

      <SectionHeader
        title="Popular doctors"
        action="See all"
        onAction={() => router.push('/(tabs)/doctors')}
        theme={theme}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hScroll}>
        {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => router.push('/(tabs)/doctors')}
            style={[
              styles.catChip,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.catChipText, { color: theme.primary }]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.doctorList}>
        {doctors.slice(0, 4).map((doctor) => (
          <DoctorListCard
            key={doctor.id}
            doctor={doctor}
            onPress={() => router.push(`/doctor/${doctor.id}` as Href)}
          />
        ))}
        {doctors.length === 0 ? (
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            No verified doctors yet. Pull to refresh when the API is online.
          </Text>
        ) : null}
      </View>

      <SectionHeader
        title="Appointments"
        action="Open"
        onAction={() => router.push('/(tabs)/appointments')}
        theme={theme}
      />
      {liveAppointment ? (
        <View
          style={[
            styles.listCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <Text style={[styles.listTitle, { color: theme.brandDark }]}>
            {liveAppointment.doctor?.fullName ||
              liveAppointment.appointmentCode ||
              'Care visit'}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {(liveAppointment.appointmentCode || 'Visit') +
              (liveAppointment.doctor?.specialty
                ? ` · ${liveAppointment.doctor.specialty}`
                : '')}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {new Date(liveAppointment.scheduledAt).toLocaleString()}
          </Text>
          <Text
            style={[
              styles.status,
              {
                color: theme.success,
                backgroundColor: theme.backgroundSelected,
              },
            ]}>
            {liveAppointment.status.replace(/_/g, ' ')}
          </Text>
        </View>
      ) : (
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          No upcoming appointments.
        </Text>
      )}

      <SectionHeader
        title="Medications"
        action="All"
        onAction={() => router.push('/health/medications')}
        theme={theme}
      />
      {medications.length === 0 ? (
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          No medications yet.
        </Text>
      ) : (
        medications.slice(0, 3).map((med) => (
          <View
            key={med.id}
            style={[
              styles.listCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.listTitle, { color: theme.brandDark }]}>
              {med.name}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {[med.dosage, med.frequency].filter(Boolean).join(' · ') ||
                'As prescribed'}
            </Text>
          </View>
        ))
      )}
    </Screen>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
  theme,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: theme.brandDark }]}>
        {title}
      </Text>
      {action && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={{ color: theme.primary, fontFamily: Fonts.semibold }}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DailyBar({
  label,
  value,
  ratio,
  theme,
}: {
  label: string;
  value: string;
  ratio: number;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.barTop}>
        <Text style={[styles.barLabel, { color: theme.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.barValue, { color: theme.brandDark }]}>
          {value}
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.round(ratio * 100)}%`, backgroundColor: theme.primary },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.light,
  },
  greetWrap: { flex: 1, gap: 2 },
  hello: { fontFamily: Fonts.bold, fontSize: 20 },
  ready: { fontFamily: Fonts.regular, fontSize: 13 },
  patientId: {
    marginTop: 4,
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.primary,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.light,
  },
  searchBox: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: 4,
  },
  searchInput: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  serviceCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  serviceTitle: { fontFamily: Fonts.semibold, fontSize: 15 },
  serviceDesc: { fontFamily: Fonts.regular, fontSize: 12 },
  promo: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  promoTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: '#fff',
  },
  promoText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  promoBtn: { alignSelf: 'flex-start', marginTop: 6 },
  dailyCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.three,
  },
  barTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: { fontFamily: Fonts.medium, fontSize: 12 },
  barValue: { fontFamily: Fonts.semibold, fontSize: 12 },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: 4 },
  hScroll: { gap: Spacing.two, paddingVertical: 2 },
  catChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  catChipText: { fontFamily: Fonts.medium, fontSize: 12 },
  doctorList: { gap: Spacing.three },
  listCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  listTitle: { fontFamily: Fonts.semibold, fontSize: 15 },
  meta: { fontFamily: Fonts.regular, fontSize: 13 },
  status: {
    alignSelf: 'flex-start',
    marginTop: 4,
    fontFamily: Fonts.medium,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
});
