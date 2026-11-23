import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DoctorListCard } from '@/components/doctor-list-card';
import { HospitalRequestsCard } from '@/components/hospital-requests-card';
import { Screen } from '@/components/screen';
import { AppLoadingSkeleton, ListSkeleton } from '@/components/skeleton';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { CATEGORIES } from '@/constants/content';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useDoctors } from '@/hooks/use-doctors';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import {
  getCmsBundleRequest,
  getTodayHealthLog,
  listAppointmentsRequest,
  listHealthcareAppointments,
  listMedicationsRequest,
  type AppointmentItem,
  type CmsListItem,
  type MedicationItem,
} from '@/lib/api';
import {
  defaultsForSlug,
  itemSlug,
  pageList,
  type ListPageSlug,
} from '@/lib/cms-list';

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

const EXPLORE_HUB: {
  id: string;
  title: string;
  desc: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  image: string;
}[] = [
  {
    id: 'about',
    title: 'About',
    desc: 'Story, mission, vision & team',
    href: '/about' as Href,
    icon: 'information-circle-outline',
    image:
      'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'care',
    title: 'Care',
    desc: 'Hospitals, doctors & visits',
    href: '/(tabs)/hospitals' as Href,
    icon: 'heart-outline',
    image:
      'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'training',
    title: 'Training',
    desc: 'Digital health programmes',
    href: '/about/training' as Href,
    icon: 'school-outline',
    image:
      'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'events',
    title: 'Events',
    desc: 'Workshops & open days',
    href: '/about/events' as Href,
    icon: 'calendar-outline',
    image:
      'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'insights',
    title: 'Insights',
    desc: 'Guides & health stories',
    href: '/about/insights' as Href,
    icon: 'newspaper-outline',
    image:
      'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

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
    href: '/(tabs)/hospitals' as Href,
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
  {
    id: 'about',
    title: 'About',
    desc: 'Team & more',
    href: '/about' as Href,
    icon: 'information-circle-outline',
  },
];

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function maskHealthId(id: string) {
  if (id.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(10, id.length - 4))}${id.slice(-4)}`;
}

function progress(value: number, goal: number) {
  return Math.max(0.08, Math.min(1, value / goal));
}

export default function HomeScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const { user, profile, accessToken, refreshProfile, apiOnline } = useAuth();
  const { doctors, refresh, loading: doctorsLoading } = useDoctors();
  const [todayLog, setTodayLog] = useState<TodayLog | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [healthIdVisible, setHealthIdVisible] = useState(false);
  const [cmsPages, setCmsPages] = useState<
    Awaited<ReturnType<typeof getCmsBundleRequest>>['pages']
  >([]);

  const isGuest = !accessToken;
  const fullName = user?.fullName || (isGuest ? 'Guest' : 'there');
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

  const exploreLists = useMemo(() => {
    const lastFour = (kind: ListPageSlug) => {
      const items =
        pageList(cmsPages, kind, defaultsForSlug(kind)).list.items || [];
      return items.slice(-4).reverse();
    };
    return {
      training: lastFour('training'),
      events: lastFour('events'),
      insights: lastFour('insights'),
    };
  }, [cmsPages]);

  const loadCms = useCallback(async () => {
    try {
      const bundle = await getCmsBundleRequest();
      setCmsPages(bundle.pages || []);
    } catch {
      setCmsPages([]);
    }
  }, []);

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
    await Promise.all([refreshProfile(), refresh(), loadExtras(), loadCms()]);
  }

  useEffect(() => {
    loadExtras();
  }, [accessToken]);

  useEffect(() => {
    void loadCms();
  }, [loadCms]);

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
              {isGuest
                ? 'Browse doctors freely · Sign in to book'
                : `${fullName}${apiOnline ? ' · Connected' : ' · Offline'}`}
            </Text>
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
                  {healthIdVisible
                    ? healthId
                    : maskHealthId(healthId)}
                </Text>
                <Ionicons
                  name={healthIdVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={15}
                  color={Brand.primary}
                />
              </Pressable>
            ) : null}
          </View>
          {isGuest ? (
            <Pressable
              onPress={() => router.push('/sign-in')}
              style={[styles.bell, { backgroundColor: Brand.light }]}>
              <Ionicons name="log-in-outline" size={20} color={theme.primary} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/(tabs)/notifications')}
              style={[styles.bell, { backgroundColor: Brand.light }]}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={theme.primary}
              />
            </Pressable>
          )}
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
      </LinearGradient>

      {/* Today's activity — top, full-width */}
      <TodayActivityCard
        daily={daily}
        theme={theme}
        onOpen={() => router.push('/(tabs)/health')}
      />

      {!isGuest ? (
        <HospitalRequestsCard accessToken={accessToken} compact />
      ) : null}

      {/* Care tools — horizontal scroll row (name under icon) */}
      <View>
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
      </View>

      <LinearGradient
        colors={[theme.primary, '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promo}>
        <Text style={[styles.promoTitle, { fontSize: responsive.titleSize }]}>
          Better care, closer to home
        </Text>
        <Text style={[styles.promoText, { fontSize: responsive.bodySize }]}>
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

      {/* Explore — bottom of home, CMS-backed data + correct views */}
      <SectionHeader
        title="Explore Daryeel"
        action="About"
        onAction={() => router.push('/about' as Href)}
        theme={theme}
      />
      <Text style={[styles.careSub, { color: theme.textSecondary }]}>
        About, Care, Training, Events & Insights — full-width cards
      </Text>
      <View style={[styles.exploreGrid, { gap: responsive.gap }]}>
        {EXPLORE_HUB.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(item.href)}
            style={[
              styles.exploreCard,
              styles.exploreCardFull,
              {
                width: '100%',
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <View style={[styles.exploreImageWrap, styles.exploreImageWrapFull]}>
              <Image
                source={{ uri: item.image }}
                style={styles.exploreImage}
                contentFit="cover"
              />
              <View style={styles.exploreImageShade} />
              <View style={styles.exploreIconBadge}>
                <Ionicons name={item.icon} size={16} color={Brand.primary} />
              </View>
              <Text style={styles.exploreFullLabel}>{item.title}</Text>
            </View>
            <View style={styles.exploreFullBody}>
              <Text
                style={[styles.exploreDesc, { color: theme.textSecondary }]}
                numberOfLines={2}>
                {item.desc}
              </Text>
              <Text style={[styles.exploreOpen, { color: theme.primary }]}>
                View {item.title} →
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <ExploreListPreview
        title="Latest training"
        action="See all"
        onAction={() => router.push('/about/training' as Href)}
        items={exploreLists.training}
        base="/about/training"
        theme={theme}
        gap={responsive.gap}
        cardWidth={(responsive.contentWidth - responsive.gap) / 2}
      />
      <ExploreListPreview
        title="Latest events"
        action="See all"
        onAction={() => router.push('/about/events' as Href)}
        items={exploreLists.events}
        base="/about/events"
        theme={theme}
        gap={responsive.gap}
        cardWidth={(responsive.contentWidth - responsive.gap) / 2}
      />
      <ExploreListPreview
        title="Latest insights"
        action="See all"
        onAction={() => router.push('/about/insights' as Href)}
        items={exploreLists.insights}
        base="/about/insights"
        theme={theme}
        gap={responsive.gap}
        cardWidth={(responsive.contentWidth - responsive.gap) / 2}
      />
    </Screen>
  );
}

function ExploreListPreview({
  title,
  action,
  onAction,
  items,
  base,
  theme,
  gap,
  cardWidth,
}: {
  title: string;
  action: string;
  onAction: () => void;
  items: CmsListItem[];
  base: '/about/training' | '/about/events' | '/about/insights';
  theme: ReturnType<typeof useTheme>;
  gap: number;
  cardWidth: number;
}) {
  if (!items.length) return null;
  return (
    <View style={styles.latestBlock}>
      <SectionHeader
        title={title}
        action={action}
        onAction={onAction}
        theme={theme}
      />
      <View style={[styles.latestGrid, { gap }]}>
        {items.map((item, index) => {
          const slug = itemSlug(item, index);
          return (
            <Pressable
              key={slug}
              onPress={() => router.push(`${base}/${slug}` as Href)}
              style={({ pressed }) => [
                styles.latestTile,
                {
                  width: cardWidth,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
                pressed && { opacity: 0.9 },
              ]}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.latestTileImage}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.latestTileImage,
                    styles.latestThumbFallback,
                    { backgroundColor: Brand.light },
                  ]}>
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={theme.primary}
                  />
                </View>
              )}
              <View style={styles.latestTileBody}>
                {(item.tag || item.meta) && (
                  <Text
                    style={[styles.latestEyebrow, { color: theme.primary }]}
                    numberOfLines={1}>
                    {[item.tag, item.meta].filter(Boolean).join(' · ')}
                  </Text>
                )}
                <Text
                  style={[styles.latestTitle, { color: theme.brandDark }]}
                  numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
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

function TodayActivityCard({
  daily,
  theme,
  onOpen,
}: {
  daily: {
    steps: number;
    waterMl: number;
    sleepHours: number;
    mood: string;
  };
  theme: ReturnType<typeof useTheme>;
  onOpen: () => void;
}) {
  const stepsRatio = progress(Number(daily.steps), DEFAULT_STEPS_GOAL);
  const waterRatio = progress(Number(daily.waterMl), DEFAULT_WATER_GOAL);
  const sleepRatio = progress(Number(daily.sleepHours), DEFAULT_SLEEP_GOAL);
  const stepsPct = Math.round(stepsRatio * 100);

  return (
    <Pressable onPress={onOpen} style={styles.activityWrap}>
      <LinearGradient
        colors={[Brand.primary, '#0B3D91']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activityHero}>
        <View style={styles.activityHeroTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.activityEyebrow}>{"Today's activity"}</Text>
            <Text style={styles.activitySteps}>
              {Number(daily.steps).toLocaleString()}
            </Text>
            <Text style={styles.activityStepsLabel}>
              steps · {stepsPct}% of {DEFAULT_STEPS_GOAL.toLocaleString()}
            </Text>
          </View>
          <View style={styles.activityRing}>
            <Text style={styles.activityRingPct}>{stepsPct}%</Text>
            <Text style={styles.activityRingCap}>goal</Text>
          </View>
        </View>
        <View style={styles.activityTrack}>
          <View
            style={[
              styles.activityFill,
              { width: `${Math.min(100, stepsPct)}%` },
            ]}
          />
        </View>
        <View style={styles.activityHeroFoot}>
          <Text style={styles.activityOpen}>Open health log</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </View>
      </LinearGradient>

      <View
        style={[
          styles.activityMetrics,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <ActivityMetric
          icon="water-outline"
          label="Water"
          value={`${daily.waterMl}`}
          unit="ml"
          ratio={waterRatio}
          theme={theme}
        />
        <View
          style={[styles.activityDivider, { backgroundColor: theme.border }]}
        />
        <ActivityMetric
          icon="moon-outline"
          label="Sleep"
          value={`${daily.sleepHours}`}
          unit="h"
          ratio={sleepRatio}
          theme={theme}
        />
        <View
          style={[styles.activityDivider, { backgroundColor: theme.border }]}
        />
        <ActivityMetric
          icon="happy-outline"
          label="Mood"
          value={String(daily.mood || '—')}
          unit=""
          ratio={daily.mood && daily.mood !== '—' ? 1 : 0}
          theme={theme}
        />
      </View>
    </Pressable>
  );
}

function ActivityMetric({
  icon,
  label,
  value,
  unit,
  ratio,
  theme,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  unit: string;
  ratio: number;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.activityMetric}>
      <View style={[styles.activityMetricIcon, { backgroundColor: Brand.light }]}>
        <Ionicons name={icon} size={16} color={theme.primary} />
      </View>
      <Text style={[styles.activityMetricLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.activityMetricValue, { color: theme.brandDark }]}>
        {value}
        {unit ? (
          <Text style={[styles.activityMetricUnit, { color: theme.textSecondary }]}>
            {' '}
            {unit}
          </Text>
        ) : null}
      </Text>
      <View style={[styles.activityMiniTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.activityMiniFill,
            {
              width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`,
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
  hello: { fontFamily: Fonts.bold, fontSize: 20, flexShrink: 1 },
  ready: { fontFamily: Fonts.regular, fontSize: 13, flexShrink: 1 },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exploreCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: Spacing.three,
    gap: 4,
  },
  exploreCardFull: {
    paddingBottom: Spacing.two,
  },
  exploreImageWrap: {
    width: '100%',
    height: 100,
    backgroundColor: Brand.light,
  },
  exploreImageWrapFull: {
    height: 148,
  },
  exploreImage: { width: '100%', height: '100%' },
  exploreImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,61,145,0.28)',
  },
  exploreIconBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  exploreFullLabel: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    right: 12,
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  exploreFullBody: {
    paddingTop: 8,
    gap: 4,
  },
  exploreTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    paddingHorizontal: Spacing.three,
    marginTop: 8,
  },
  exploreDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: Spacing.three,
  },
  exploreOpen: {
    marginTop: 2,
    fontFamily: Fonts.semibold,
    fontSize: 12,
    paddingHorizontal: Spacing.three,
  },
  latestBlock: { gap: Spacing.two },
  latestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  latestTile: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  latestTileImage: {
    width: '100%',
    height: 72,
  },
  latestThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestTileBody: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  latestEyebrow: {
    fontFamily: Fonts.semibold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  latestTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    lineHeight: 15,
  },
  patientIdRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientId: {
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
  activityWrap: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    gap: 0,
  },
  activityHero: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  activityHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  activityEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  activitySteps: {
    marginTop: 4,
    color: Brand.white,
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 38,
  },
  activityStepsLabel: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  activityRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityRingPct: {
    color: Brand.white,
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  activityRingCap: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: Fonts.medium,
    fontSize: 10,
    marginTop: -2,
  },
  activityTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  activityFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.white,
  },
  activityHeroFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityOpen: {
    color: Brand.white,
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
  activityMetrics: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  activityDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  activityMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  activityMetricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityMetricLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  activityMetricValue: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  activityMetricUnit: {
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  activityMiniTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  activityMiniFill: {
    height: 4,
    borderRadius: 2,
  },
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


