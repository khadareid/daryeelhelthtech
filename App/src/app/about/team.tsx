import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/screen';
import { CardListSkeleton } from '@/components/skeleton';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { siteConfig } from '@/config/site';
import {
  getCmsBundleRequest,
  type CmsBundle,
  type CmsTeamMember,
} from '@/lib/api';

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
  PARTNER: 'Our Partners',
  SPONSOR: 'Our Sponsors',
  VOLUNTEER: 'Our Volunteers',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function MemberCard({ member }: { member: CmsTeamMember }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(member.fullName)}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.name}>{member.fullName}</Text>
          <Text style={styles.role}>{member.title}</Text>
          {member.department ? (
            <Text style={styles.dept}>{member.department}</Text>
          ) : null}
        </View>
      </View>
      {member.bio ? <Text style={styles.bio}>{member.bio}</Text> : null}
      {member.expertise?.length ? (
        <View style={styles.tags}>
          {member.expertise.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** View-only leadership & team screen — no CMS admin controls in the App. */
export default function AboutTeamScreen() {
  const [bundle, setBundle] = useState<CmsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setBundle(await getCmsBundleRequest());
    } catch {
      setError('Could not load team. Pull to retry.');
      setBundle(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const page = bundle?.leadershipPage;
  const groups = bundle?.team?.groups || {};
  const highlights = Array.isArray(page?.highlights) ? page!.highlights! : [];

  return (
    <Screen
      headerTitle="Our Team"
      headerSubtitle="Leadership & staff"
      scroll={false}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
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
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{siteConfig.appName}</Text>
          <Text style={styles.heroTitle}>
            {page?.title || 'Meet Our Leadership & Team'}
          </Text>
          <Text style={styles.heroSub}>
            {page?.summary ||
              'Qualified professionals committed to serving the community with professionalism, integrity, and passion.'}
          </Text>
        </View>

        {highlights.length ? (
          <View style={styles.highlights}>
            {highlights.map((h) => (
              <View key={h.title} style={styles.highlight}>
                <Text style={styles.highlightTitle}>{h.title}</Text>
                {h.description ? (
                  <Text style={styles.highlightDesc}>{h.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.highlights}>
            {[
              'Qualified Professionals',
              'Committed to Service',
              'Excellence in Action',
            ].map((title) => (
              <View key={title} style={styles.highlight}>
                <Text style={styles.highlightTitle}>{title}</Text>
              </View>
            ))}
          </View>
        )}

        {loading ? <CardListSkeleton rows={4} /> : null}

        {error && !loading ? (
          <Pressable style={styles.errorBox} onPress={() => void load()}>
            <Text style={styles.errorText}>{error}</Text>
          </Pressable>
        ) : null}

        {!loading &&
          SECTION_ORDER.map((key) => {
            const members = groups[key];
            if (!members?.length) return null;
            return (
              <View key={key} style={styles.section}>
                <Text style={styles.sectionTitle}>{SECTION_TITLES[key]}</Text>
                {members.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </View>
            );
          })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  hero: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    color: Brand.white,
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  heroSub: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  highlights: {
    gap: Spacing.two,
  },
  highlight: {
    backgroundColor: Brand.light,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  highlightTitle: {
    color: Brand.dark,
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  highlightDesc: {
    marginTop: 4,
    color: Brand.muted,
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Brand.dark,
    fontFamily: Fonts.bold,
    fontSize: 18,
    marginTop: Spacing.two,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTop: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Brand.white,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  cardMeta: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: Brand.dark,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  role: {
    color: Brand.primary,
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
  dept: {
    color: Brand.muted,
    fontFamily: Fonts.medium,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  bio: {
    color: Brand.muted,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Brand.light,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: Brand.dark,
    fontFamily: Fonts.semibold,
    fontSize: 11,
  },
  errorBox: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  errorText: {
    color: Brand.danger,
    fontFamily: Fonts.medium,
    fontSize: 13,
    textAlign: 'center',
  },
});
