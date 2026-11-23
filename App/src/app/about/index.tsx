import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen, SCREEN_SCROLL_BOTTOM } from '@/components/screen';
import { siteConfig } from '@/config/site';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import {
  getCmsBundleRequest,
  type CmsBundle,
  type CmsTeamMember,
} from '@/lib/api';

const VALUES = [
  {
    title: 'Patient first',
    text: 'Safer, clearer care for families.',
  },
  {
    title: 'Access for all',
    text: 'Hospitals and doctors you can find.',
  },
  {
    title: 'Privacy & trust',
    text: 'Consent and responsible health data.',
  },
  {
    title: 'Partnership',
    text: 'A trusted care network that grows.',
  },
];

const LINKS = [
  {
    id: 'training',
    label: 'Training',
    icon: 'school-outline' as const,
    href: '/about/training' as Href,
  },
  {
    id: 'events',
    label: 'Events',
    icon: 'calendar-outline' as const,
    href: '/about/events' as Href,
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: 'newspaper-outline' as const,
    href: '/about/insights' as Href,
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: 'call-outline' as const,
    href: '/about/contact' as Href,
  },
];

const SECTION_ORDER = [
  'BOARD',
  'EXECUTIVE',
  'DEPARTMENT',
  'STAFF',
  'PARTNER',
  'SPONSOR',
  'VOLUNTEER',
] as const;

const SECTION_TITLES: Record<string, string> = {
  BOARD: 'Board of Directors',
  EXECUTIVE: 'Executive Leadership',
  DEPARTMENT: 'Department Leadership',
  STAFF: 'Dedicated Staff',
  PARTNER: 'Partners',
  SPONSOR: 'Sponsors',
  VOLUNTEER: 'Volunteers',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AboutIndexScreen() {
  const responsive = useResponsive();
  const [bundle, setBundle] = useState<CmsBundle | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setBundle(await getCmsBundleRequest());
    } catch {
      setBundle(null);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const about = bundle?.pages?.find((p) => p.slug === 'about');
  const teamPage = bundle?.leadershipPage;
  const groups = bundle?.team?.groups || {};
  const branding = bundle?.branding;

  const cols = responsive.gridColumns;
  const gap = responsive.gap;
  const cardW =
    cols === 1
      ? '100%'
      : (responsive.contentWidth - gap * (cols - 1)) / cols;
  const missionCols = responsive.isPhone ? 1 : 2;
  const missionW =
    missionCols === 1
      ? '100%'
      : (responsive.contentWidth - gap) / 2;

  return (
    <Screen
      headerTitle="About"
      headerSubtitle={siteConfig.appName}
      scroll={false}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={Brand.primary}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <View style={styles.heroWrap}>
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=1200',
            }}
            style={[styles.heroImage, { height: responsive.heroHeight }]}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.eyebrow}>
              {branding?.appName || siteConfig.appName}
            </Text>
            <Text style={[styles.heroTitle, { fontSize: responsive.titleSize }]}>
              {about?.title || 'About Us'}
            </Text>
            <Text style={[styles.heroSub, { fontSize: responsive.bodySize }]}>
              {about?.subtitle ||
                'Discover the story, mission, and people behind Daryeel Health'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Our story</Text>
          <Text style={[styles.body, { fontSize: responsive.bodySize }]}>
            {about?.summary ||
              branding?.description ||
              siteConfig.description}
          </Text>
          <Text style={styles.tagline}>
            {branding?.tagline || siteConfig.tagline} ·{' '}
            {branding?.location || siteConfig.locations}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: responsive.titleSize }]}>
          Vision & Mission
        </Text>
        <View style={[styles.grid, { gap }]}>
          <View style={[styles.card, { width: missionW as number | '100%' }]}>
            <Text style={styles.cardTitle}>Our Vision</Text>
            <Text style={[styles.body, { fontSize: responsive.bodySize }]}>
              A Somaliland and East Africa where every family can access trusted
              care through one connected digital health identity.
            </Text>
          </View>
          <View style={[styles.card, { width: missionW as number | '100%' }]}>
            <Text style={styles.cardTitle}>Our Mission</Text>
            <Text style={[styles.body, { fontSize: responsive.bodySize }]}>
              Connect patients and providers with practical tools for records,
              bookings, hospitals, and doctors — care that is easier to find and
              trust.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: responsive.titleSize }]}>
          Core values
        </Text>
        <View style={[styles.grid, { gap }]}>
          {VALUES.map((v) => (
            <View
              key={v.title}
              style={[styles.valueCard, { width: cardW as number | '100%' }]}>
              <Text style={styles.cardTitle}>{v.title}</Text>
              <Text style={[styles.body, { fontSize: responsive.bodySize }]}>
                {v.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.teamHeader}>
          <Text style={styles.sectionLabel}>Management & Staff</Text>
          <Text style={[styles.sectionTitle, { fontSize: responsive.titleSize }]}>
            {teamPage?.title || 'Our Dedicated Team'}
          </Text>
          <Text style={[styles.body, { fontSize: responsive.bodySize }]}>
            {teamPage?.summary ||
              'Passionate professionals committed to connected healthcare.'}
          </Text>
        </View>

        {SECTION_ORDER.map((key) => {
          const members = groups[key] as CmsTeamMember[] | undefined;
          if (!members?.length) return null;
          return (
            <View key={key} style={styles.teamBlock}>
              <Text style={styles.teamSectionTitle}>
                {SECTION_TITLES[key] || key}
              </Text>
              <View style={[styles.grid, { gap }]}>
                {members.map((m) => (
                  <View
                    key={m.id}
                    style={[
                      styles.memberCard,
                      { width: cardW as number | '100%' },
                    ]}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {initials(m.fullName)}
                      </Text>
                    </View>
                    <Text style={styles.memberName} numberOfLines={2}>
                      {m.fullName}
                    </Text>
                    <Text style={styles.memberRole} numberOfLines={2}>
                      {m.title}
                    </Text>
                    {m.bio ? (
                      <Text
                        style={[styles.body, { fontSize: responsive.bodySize }]}
                        numberOfLines={3}>
                        {m.bio}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <Text style={[styles.sectionTitle, { fontSize: responsive.titleSize }]}>
          Explore more
        </Text>
        <View style={[styles.grid, { gap }]}>
          {LINKS.map((link) => (
            <Pressable
              key={link.id}
              style={({ pressed }) => [
                styles.linkCard,
                { width: cardW as number | '100%' },
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => router.push(link.href)}>
              <Ionicons name={link.icon} size={18} color={Brand.primary} />
              <Text style={styles.linkText}>{link.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scroll: {
    paddingBottom: SCREEN_SCROLL_BOTTOM,
    gap: Spacing.three,
    flexGrow: 1,
  },
  heroWrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Brand.primary,
  },
  heroImage: { width: '100%', height: 180 },
  heroOverlay: {
    marginTop: -50,
    padding: Spacing.four,
    backgroundColor: 'rgba(11, 61, 145, 0.92)',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    color: Brand.white,
    fontFamily: Fonts.bold,
    fontSize: 26,
  },
  heroSub: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 8,
  },
  sectionLabel: {
    color: Brand.primary,
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: Brand.dark,
    fontFamily: Fonts.bold,
    fontSize: 20,
  },
  cardTitle: {
    color: Brand.dark,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  body: {
    color: Brand.muted,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  tagline: {
    marginTop: 4,
    color: Brand.primary,
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  valueCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: 4,
  },
  teamHeader: { gap: 6, marginTop: Spacing.two },
  teamBlock: { gap: Spacing.two },
  teamSectionTitle: {
    color: Brand.dark,
    fontFamily: Fonts.bold,
    fontSize: 17,
  },
  memberCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: 6,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Brand.white,
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  memberName: {
    color: Brand.dark,
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  memberRole: {
    color: Brand.primary,
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  linkText: {
    color: Brand.dark,
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
});
