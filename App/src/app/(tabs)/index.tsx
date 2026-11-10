import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DoctorListCard } from '@/components/doctor-list-card';
import { Screen } from '@/components/screen';
import { AppLoadingSkeleton, ListSkeleton } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { CATEGORIES } from '@/constants/content';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useDoctors } from '@/hooks/use-doctors';
import { useTheme } from '@/hooks/use-theme';
import {
  getTodayHealthLog,
  listAppointmentsRequest,
  listHealthcareAppointments,
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

type CareTool = {
  id: string;
  title: string;
  desc: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
};

/** Mirrors Website CareHome services — compact icon tiles */
const CARE_TOOLS: CareTool[] = [
  {
    id: 'doctors',
    title: 'Doctors',
    desc: 'Book a clinician',
    href: '/(tabs)/doctors',
    icon: 'medkit-outline',
  },
  {
    id: 'hospitals',
    title: 'Hospitals',
    desc: 'Book hospital visit',
    href: '/healthcare',
    icon: 'business-outline',
  },
  {
    id: 'vitals',
    title: 'Vitals',
    desc: 'Log BP & HR',
    href: '/health/vitals',
    icon: 'pulse-outline',
  },
  {
    id: 'health',
    title: 'Health',
    desc: 'Daily log',
    href: '/(tabs)/health',
    icon: 'heart-outline',
  },
  {
    id: 'visits',
    title: 'Visits',
    desc: 'Book & confirm',
    href: '/(tabs)/appointments',
    icon: 'calendar-outline',
  },
  {
    id: 'payments',
    title: 'Payments',
    desc: 'Free or pay fee',
    href: '/health/payments',
    icon: 'card-outline',
  },
  {
    id: 'records',
    title: 'Records',
    desc: 'Visits, labs, docs',
    href: '/health/medical-records',
    icon: 'document-text-outline',
  },
  {
    id: 'medications',
    title: 'Meds',
    desc: 'Your medicines',
    href: '/health/medications',
    icon: 'medical-outline',
  },
  {
    id: 'allergies',
    title: 'Allergies',
    desc: 'Reactions',
    href: '/health/allergies',
    icon: 'alert-circle-outline',
  },
  {
    id: 'family',
    title: 'Family',
    desc: 'Members',
    href: '/health/family',
    icon: 'people-outline',
  },
  {
    id: 'emergency',
    title: 'Emergency',
    desc: 'Card & contacts',
    href: '/health/emergency-card',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'prescriptions',
    title: 'Rx',
    desc: 'Prescriptions',
    href: '/health/prescriptions',
    icon: 'clipboard-outline',
  },
  {
    id: 'alerts',
    title: 'Alerts',
    desc: 'Notifications',
    href: '/(tabs)/notifications',
    icon: 'notifications-outline',
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
  const { user, profile, accessToken, refreshProfile, apiOnline } = useAuth();
  const { doctors, refresh, loading: doctorsLoading } = useDoctors();
  const [todayLog, setTodayLog] = useState<TodayLog | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);

  const fullName = user?.fullName || 'there';
  const firstName = fullName.split(' ')[0];
  const photo = user?.avatarUrl || user?.picture;
  const gender = user?.gender || profile?.gender;
  const healthId = profile?.healthId || user?.healthId;
  const liveAppointment = appointments[0];

  const daily = {
    steps: todayLog?.steps ?? 0,
    waterMl: todayLog?.waterIntakeMl ?? 0,
    sleepHours: todayLog?.sleepHours ?? 0,
    mood: todayLog?.mood ?? '—',
  };

  async function loadExtras() {
    if (!accessToken) {
      setLoadingHome(false);
      return;
    }
    try {
      const [logRes, healthcareAppts, localAppts, meds] = await Promise.all([
        getTodayHealthLog(accessToken),
        listHealthcareAppointments(accessToken).catch(() => []),
        listAppointmentsRequest(accessToken).catch(() => []),
        listMedicationsRequest(accessToken).catch(() => []),
      ]);
      const seen = new Set(healthcareAppts.map((a) => a.id));
      const merged = [
        ...healthcareAppts,
        ...localAppts.filter((a) => !seen.has(a.id)),
      ];
      setTodayLog((logRes?.result as TodayLog | null) ?? null);
      setAppointments(merged);
      setMedications(meds.filter((m) => m.isActive !== false));
    } finally {
      setLoadingHome(false);
    }
  }

  async function onRefresh() {
    await Promise.all([refreshProfile(), refresh(), loadExtras()]);
  }

  useEffect(() => {
    loadExtras();
  }, [accessToken]);

  if (loadingHome && !todayLog && appointments.length === 0) {
    return <AppLoadingSkeleton />;
  }

  return (
    <Screen onRefresh={onRefresh} headerTitle="Home">
      {/* Greeting */}
      <LinearGradient
        colors={['#FFFFFF', Brand.light, '#E8F1FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderColor: theme.border }]}>
        <View style={styles.greetRow}>
          <Pressable onPress={() => router.push('/(tabs)/profile')}>
            <UserAvatar
              name={fullName}
              photo={photo}
              gender={gender}
              size={56}
            />
          </Pressable>
          <View style={styles.greetWrap}>
            <Text style={[styles.brandLabel, { color: theme.primary }]}>
              Daryeel Health
            </Text>
            <Text style={[styles.hello, { color: theme.brandDark }]}>
              {greetingForNow()}, {firstName}
            </Text>
            <Text style={[styles.ready, { color: theme.textSecondary }]}>
              {fullName}
              {apiOnline ? ' · Connected' : ' · Offline'}
            </Text>
            {healthId ? (
              <Text style={styles.patientId}>Health ID · {healthId}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/notifications')}
            style={[styles.bell, { backgroundColor: Brand.light }]}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={theme.primary}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/doctors')}
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.textSecondary}
          />
          <TextInput
            placeholder="Search doctors, specialty, city..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            editable={false}
            pointerEvents="none"
          />
        </Pressable>

        {/* Care tools — horizontal scroll row (name under icon) */}
        <View style={styles.careHead}>
          <Text style={[styles.careTitle, { color: theme.brandDark }]}>
            Care tools
          </Text>
          <Text style={[styles.careSub, { color: theme.textSecondary }]}>
            Swipe sideways · tap a name to open
          </Text>
        </View>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={108}
          snapToAlignment="start"
          contentContainerStyle={styles.toolsRow}>
          {CARE_TOOLS.map((tool) => (
            <Pressable
              key={tool.id}
              style={[
                styles.toolTile,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: theme.border,
                },
              ]}
              onPress={() => router.push(tool.href)}>
              <View style={styles.toolIcon}>
                <Ionicons name={tool.icon} size={22} color={Brand.primary} />
              </View>
              <Text
                style={[styles.toolTitle, { color: theme.brandDark }]}
                numberOfLines={2}>
                {tool.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>

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
        <View style={styles.walkBanner}>
          <Text style={styles.walkLabel}>Walk · today</Text>
          <Text style={styles.walkValue}>
            {Number(daily.steps).toLocaleString()}
          </Text>
          <Text style={styles.walkGoal}>
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
        {doctorsLoading && doctors.length === 0 ? (
          <ListSkeleton rows={3} />
        ) : null}
        {doctors.slice(0, 4).map((doctor) => (
          <DoctorListCard
            key={doctor.id}
            doctor={doctor}
            onPress={() => router.push(`/doctor/${doctor.id}` as Href)}
          />
        ))}
        {!doctorsLoading && doctors.length === 0 ? (
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
            {
              width: `${Math.round(ratio * 100)}%`,
              backgroundColor: theme.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  greetWrap: { flex: 1, gap: 2 },
  brandLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  hello: { fontFamily: Fonts.bold, fontSize: 20 },
  ready: { fontFamily: Fonts.regular, fontSize: 13 },
  patientId: {
    marginTop: 2,
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
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    paddingVertical: 10,
  },
  careHead: { gap: 2 },
  careTitle: { fontFamily: Fonts.bold, fontSize: 17 },
  careSub: { fontFamily: Fonts.regular, fontSize: 12 },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 12,
  },
  toolTile: {
    width: 98,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.light,
  },
  toolTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
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
  walkBanner: {
    backgroundColor: Brand.primary,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  walkLabel: {
    color: '#fff',
    fontFamily: Fonts.semibold,
    fontSize: 13,
    marginBottom: 6,
  },
  walkValue: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 28,
  },
  walkGoal: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
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

