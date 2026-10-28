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
import { siteConfig } from '@/config/site';
import { CATEGORIES } from '@/constants/content';
import { HEALTH_SERVICES } from '@/constants/demo-data';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useDoctors } from '@/hooks/use-doctors';
import { useHospitals } from '@/hooks/use-hospitals';
import { useTheme } from '@/hooks/use-theme';
import { getNewsFeedRequest, getTodayHealthLog, type NewsFeedItem } from '@/lib/api';
import { hospitalCover } from '@/types/hospital';

const DEFAULT_STEPS_GOAL = 10000;
const DEFAULT_WATER_GOAL = 2000;
const DEFAULT_SLEEP_GOAL = 8;

type TodayLog = {
  mood?: string | null;
  steps?: number | null;
  waterIntakeMl?: number | null;
  sleepHours?: number | null;
};

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
  const {
    hospitals,
    loading: hospitalsLoading,
    refresh: refreshHospitals,
  } = useHospitals(9);
  const [todayLog, setTodayLog] = useState<TodayLog | null>(null);
  const [news, setNews] = useState<NewsFeedItem[]>([]);
  const serviceWidth = width < 380 ? '100%' : '48%';

  const firstName = (user?.fullName || 'there').split(' ')[0];
  const photo = user?.avatarUrl || user?.picture;
  const liveAppointment = profile?.appointments?.[0];
  const medications = profile?.medications ?? [];

  const daily = {
    steps: todayLog?.steps ?? 0,
    waterMl: todayLog?.waterIntakeMl ?? 0,
    sleepHours: todayLog?.sleepHours ?? 0,
    mood: todayLog?.mood ?? '—',
    heartRate: profile?.vitalSigns?.[0]?.heartRate ?? 0,
    weightKg:
      profile?.profile?.weight ?? profile?.vitalSigns?.[0]?.weight ?? 0,
  };

  async function loadToday() {
    if (!accessToken) return;
    const res = await getTodayHealthLog(accessToken);
    const data = (res?.result ?? res?.data ?? null) as TodayLog | null;
    setTodayLog(data);
  }

  async function loadNews() {
    const rows = await getNewsFeedRequest({ limit: 6, token: accessToken });
    setNews(rows);
  }

  async function onRefresh() {
    await Promise.all([
      refreshProfile(),
      refresh(),
      refreshHospitals(),
      loadToday(),
      loadNews(),
    ]);
  }

  useEffect(() => {
    loadToday();
    loadNews();
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
          {profile?.profile?.healthId ? (
            <Text style={styles.patientId}>
              Patient ID · {profile.profile.healthId}
            </Text>
          ) : null}
        </View>
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
          placeholder="Search doctors, hospitals, labs..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          onFocus={() => router.push('/(tabs)/doctors')}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.brandDark }]}>
        Health services
      </Text>
      <View style={styles.servicesGrid}>
        {HEALTH_SERVICES.map((service) => (
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
            onPress={() => {
              if (service.id === 's2') {
                router.push('/(tabs)/hospitals' as Href);
                return;
              }
              if (service.id === 's4') {
                router.push('/(tabs)/appointments');
                return;
              }
              if (service.id === 's3') {
                router.push('/(tabs)/health');
                return;
              }
              router.push('/(tabs)/doctors');
            }}>
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
          Book clinicians, open hospitals, and keep labs & prescriptions in one
          place.
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
            Walk · auto steps
          </Text>
          <Text
            style={{
              color: '#fff',
              fontFamily: Fonts.bold,
              fontSize: 28,
            }}>
            {daily.steps.toLocaleString()}
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
          ratio={progress(daily.waterMl, DEFAULT_WATER_GOAL)}
          theme={theme}
        />
        <DailyBar
          label="Sleep"
          value={`${daily.sleepHours} / ${DEFAULT_SLEEP_GOAL} h`}
          ratio={progress(Number(daily.sleepHours), DEFAULT_SLEEP_GOAL)}
          theme={theme}
        />
        <View style={styles.vitalRow}>
          <MiniStat
            label="Heart rate"
            value={daily.heartRate ? `${daily.heartRate} bpm` : '—'}
            theme={theme}
          />
          <MiniStat
            label="Weight"
            value={daily.weightKg ? `${daily.weightKg} kg` : '—'}
            theme={theme}
          />
          <MiniStat label="Mood" value={String(daily.mood)} theme={theme} />
        </View>
      </Pressable>

      <SectionHeader
        title="Hospitals & clinics"
        action="See all"
        onAction={() => router.push('/(tabs)/hospitals' as Href)}
        theme={theme}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hScroll}>
        {hospitals.map((hospital) => (
          <Pressable
            key={hospital.tenantId}
            onPress={() =>
              router.push(`/hospital/${hospital.tenantId}` as Href)
            }
            style={[
              styles.hospitalCard,
              {
                width: width < 380 ? 210 : 240,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <Image
              source={hospitalCover(hospital)}
              style={styles.hospitalImage}
              contentFit="cover"
            />
            <Text style={[styles.hospitalName, { color: theme.brandDark }]}>
              {hospital.companyName}
            </Text>
            <Text style={[styles.hospitalMeta, { color: theme.textSecondary }]}>
              {[hospital.city, hospital.country].filter(Boolean).join(' · ') ||
                'Location TBA'}
            </Text>
            <Text style={[styles.hospitalMeta, { color: theme.textSecondary }]}>
              {hospital.industry || 'Health facility'}
            </Text>
            <Text style={[styles.rating, { color: theme.primary }]}>
              ★ {Number(hospital.rating || 0).toFixed(1)}
              {typeof hospital._count?.professionalProfiles === 'number'
                ? ` · ${hospital._count.professionalProfiles} doctors`
                : ''}
            </Text>
          </Pressable>
        ))}
        {!hospitalsLoading && hospitals.length === 0 ? (
          <View
            style={[
              styles.hospitalCard,
              {
                width: width < 380 ? 210 : 240,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                padding: Spacing.three,
                justifyContent: 'center',
              },
            ]}>
            <Text style={[styles.hospitalName, { color: theme.brandDark }]}>
              No hospitals yet
            </Text>
            <Text style={[styles.hospitalMeta, { color: theme.textSecondary }]}>
              Pull to refresh when the public hospitals API is online.
            </Text>
          </View>
        ) : null}
      </ScrollView>

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
            {liveAppointment.doctorName ||
              liveAppointment.facilityName ||
              'Care visit'}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {(liveAppointment.appointmentCode || 'Visit') +
              ' · ' +
              (liveAppointment.facilityName || siteConfig.hospital.name)}
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

      <SectionHeader title="Prescriptions" theme={theme} />
      {medications.length === 0 ? (
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          No prescriptions yet.
        </Text>
      ) : (
        medications.slice(0, 3).map((med, i) => (
          <View
            key={med.medicationid || String(i)}
            style={[
              styles.listCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.listTitle, { color: theme.brandDark }]}>
              {med.name || 'Medication'}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {med.dosage || 'As prescribed'}
            </Text>
            {med.instructions ? (
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {med.instructions}
              </Text>
            ) : null}
          </View>
        ))
      )}

      <SectionHeader title="Laboratory" theme={theme} />
      <Text style={[styles.meta, { color: theme.textSecondary }]}>
        No lab orders yet.
      </Text>

      <SectionHeader title="Medical records" theme={theme} />
      <Text style={[styles.meta, { color: theme.textSecondary }]}>
        No medical records yet.
      </Text>

      <SectionHeader title="Pharmacies" theme={theme} />
      <Text style={[styles.meta, { color: theme.textSecondary }]}>
        No pharmacies listed yet.
      </Text>

      <SectionHeader
        title="Health news & tips"
        action="See all"
        onAction={() => router.push('/news' as Href)}
        theme={theme}
      />
      {news.length === 0 ? (
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          No published news yet.
        </Text>
      ) : null}
      {news.map((item) => (
        <Pressable
          key={item.newspostid}
          onPress={() => router.push(`/news/${item.newspostid}` as Href)}
          style={[
            styles.newsCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          {item.coverImageUrl ? (
            <Image
              source={item.coverImageUrl}
              style={styles.newsImage}
              contentFit="cover"
            />
          ) : null}
          <View style={styles.newsBody}>
            <Text style={[styles.newsCat, { color: theme.primary }]}>
              {String(item.category || '').replace(/_/g, ' ')}
            </Text>
            <Text style={[styles.listTitle, { color: theme.brandDark }]}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.content}
            </Text>
          </View>
        </Pressable>
      ))}
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
          <Text style={[styles.seeAll, { color: theme.primary }]}>{action}</Text>
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
    <View style={styles.dailyRow}>
      <View style={styles.dailyTop}>
        <Text style={[styles.dailyLabel, { color: theme.brandDark }]}>
          {label}
        </Text>
        <Text style={[styles.dailyValue, { color: theme.textSecondary }]}>
          {value}
        </Text>
      </View>
      <View
        style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
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

function MiniStat({
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
        styles.miniStat,
        { backgroundColor: theme.backgroundSelected },
      ]}>
      <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.miniValue, { color: theme.brandDark }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  greetCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greetWrap: { flex: 1 },
  hello: {
    fontFamily: Fonts.bold,
    fontSize: 20,
  },
  ready: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  patientId: {
    marginTop: 6,
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.primary,
    letterSpacing: 0.3,
  },
  searchBox: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  searchInput: {
    minHeight: 48,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 18,
  },
  seeAll: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  serviceCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  serviceTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  serviceDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  promo: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  promoTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  promoText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
  },
  promoBtn: {
    alignSelf: 'flex-start',
    minHeight: 42,
    marginTop: 4,
  },
  dailyCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  dailyRow: { gap: 6 },
  dailyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  dailyValue: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  vitalRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  miniStat: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.two,
    gap: 2,
  },
  miniLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  miniValue: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  hScroll: {
    gap: Spacing.three,
    paddingRight: Spacing.two,
  },
  hospitalCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  hospitalImage: {
    width: '100%',
    height: 110,
  },
  hospitalName: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  hospitalMeta: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: Spacing.three,
  },
  rating: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    paddingTop: 2,
  },
  catChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  catChipText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  doctorList: {
    gap: Spacing.three,
  },
  listCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 3,
  },
  listTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  status: {
    marginTop: 4,
    alignSelf: 'flex-start',
    fontFamily: Fonts.medium,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  newsCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 140,
  },
  newsBody: {
    padding: Spacing.three,
    gap: 4,
  },
  newsCat: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
