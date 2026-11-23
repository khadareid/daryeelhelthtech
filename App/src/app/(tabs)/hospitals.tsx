import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/screen';
import { CardListSkeleton } from '@/components/skeleton';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import {
  healthcareHospitalId,
  healthcareHospitalName,
  listHealthcareHospitals,
  type HealthcareHospital,
} from '@/lib/api';

const DEFAULT_LOGO =
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80';

/** Hospitals tab — responsive grid, stays inside tabs. */
export default function HospitalsTab() {
  const theme = useTheme();
  const responsive = useResponsive();
  const { accessToken } = useAuth();
  const [hospitals, setHospitals] = useState<HealthcareHospital[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const cols = responsive.gridColumns > 1 ? Math.min(responsive.gridColumns, 2) : 1;
  const cardWidth =
    cols === 1
      ? '100%'
      : (responsive.contentWidth - responsive.gap) / cols;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listHealthcareHospitals(accessToken, {
        search: query.trim() || undefined,
        limit: 40,
      });
      setHospitals(rows);
    } finally {
      setLoading(false);
    }
  }, [accessToken, query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, query ? 280 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  return (
    <Screen
      headerTitle="Hospitals"
      headerSubtitle="Partner facilities"
      onRefresh={load}
      refreshing={loading}>
      <LinearGradient
        colors={[Brand.primary, '#0B3D91']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <Text style={styles.heroEyebrow}>Care network</Text>
        <Text style={[styles.heroTitle, { fontSize: responsive.titleSize }]}>
          Partner hospitals
        </Text>
        <Text style={styles.heroSub}>
          Book a hospital visit — requests go to the facility for confirmation
          and OPD.
        </Text>
      </LinearGradient>

      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search hospital or city"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.brandDark }]}
        />
      </View>

      <Text style={[styles.count, { color: theme.textSecondary }]}>
        {loading ? 'Loading…' : `${hospitals.length} hospitals`}
      </Text>

      <View style={[styles.grid, { gap: responsive.gap }]}>
        {loading && hospitals.length === 0 ? <CardListSkeleton rows={4} /> : null}

        {hospitals.map((hospital) => {
          const id = healthcareHospitalId(hospital);
          if (!id) return null;
          const name = healthcareHospitalName(hospital);
          const rating = Number(hospital.rating ?? hospital.averageRating ?? 0);
          const doctors =
            hospital._count?.professionalProfiles ??
            hospital.doctors?.length ??
            0;
          const logo =
            hospital.publicLogoUrl || hospital.logoUrl || DEFAULT_LOGO;
          const place =
            [hospital.city, hospital.country].filter(Boolean).join(', ') ||
            'Somaliland';

          return (
            <Pressable
              key={id}
              onPress={() =>
                router.push(`/healthcare/${encodeURIComponent(id)}` as Href)
              }
              style={[
                styles.card,
                {
                  width: cardWidth,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}>
              <Image source={logo} style={styles.cover} contentFit="cover" />
              <View style={styles.cardBody}>
                <Text
                  style={[styles.name, { color: theme.brandDark }]}
                  numberOfLines={2}>
                  {name}
                </Text>
                <Text
                  style={[styles.meta, { color: theme.textSecondary }]}
                  numberOfLines={1}>
                  {place}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.chip, { color: theme.primary }]}>
                    {rating > 0 ? `★ ${rating.toFixed(1)}` : 'Hospital'}
                  </Text>
                  {doctors > 0 ? (
                    <Text
                      style={[styles.chipMuted, { color: theme.textSecondary }]}>
                      {doctors} doctors
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.viewLink, { color: theme.primary }]}>
                  View →
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {!loading && hospitals.length === 0 ? (
        <View
          style={[
            styles.empty,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <Text style={[styles.emptyTitle, { color: theme.brandDark }]}>
            No hospitals found
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Try another search, or pull to refresh.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: 6,
    overflow: 'hidden',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: { color: Brand.white, fontFamily: Fonts.bold },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    padding: 0,
  },
  count: { fontFamily: Fonts.medium, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 120,
    backgroundColor: Brand.light,
  },
  cardBody: { padding: Spacing.three, gap: 4 },
  name: { fontFamily: Fonts.bold, fontSize: 16 },
  meta: { fontFamily: Fonts.regular, fontSize: 13 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  chip: { fontFamily: Fonts.semibold, fontSize: 12 },
  chipMuted: { fontFamily: Fonts.regular, fontSize: 12 },
  viewLink: { marginTop: 4, fontFamily: Fonts.semibold, fontSize: 13 },
  empty: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: 6,
  },
  emptyTitle: { fontFamily: Fonts.semibold, fontSize: 16 },
  emptyText: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
});
