import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { StackScreen } from '@/components/stack-screen';
import { CardListSkeleton } from '@/components/skeleton';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  healthcareHospitalId,
  healthcareHospitalName,
  listHealthcareHospitals,
  type HealthcareHospital,
} from '@/lib/api';

const DEFAULT_LOGO =
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80';

export default function HealthcareHospitalsScreen() {
  const theme = useTheme();
  const { accessToken } = useAuth();
  const [hospitals, setHospitals] = useState<HealthcareHospital[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
    <StackScreen
      title="Hospitals"
      showHeader={false}
      onRefresh={load}
      refreshing={loading}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.title, { color: theme.brandDark }]}>
          Hospitals
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Book a hospital visit through Daryeel Health. Requests go to the
          hospital for confirmation and OPD.
        </Text>
      </View>

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

      <View style={styles.list}>
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

          return (
            <Pressable
              key={id}
              onPress={() =>
                router.push(`/healthcare/${encodeURIComponent(id)}` as Href)
              }
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}>
              <Image source={logo} style={styles.logo} contentFit="cover" />
              <View style={styles.cardBody}>
                <Text style={[styles.name, { color: theme.brandDark }]}>
                  {name}
                </Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {[hospital.city, hospital.country].filter(Boolean).join(', ') ||
                    'Somaliland'}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.chip, { color: theme.primary }]}>
                    {rating > 0 ? `★ ${rating.toFixed(1)}` : 'Hospital'}
                  </Text>
                  {doctors > 0 ? (
                    <Text style={[styles.chipMuted, { color: theme.textSecondary }]}>
                      {doctors} doctors
                    </Text>
                  ) : null}
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>
          );
        })}

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
              Try another search, or pull to refresh when the hospital directory
              is available.
            </Text>
          </View>
        ) : null}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: 6,
  },
  title: { fontFamily: Fonts.bold, fontSize: 28 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
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
  list: { gap: Spacing.three },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Brand.light,
  },
  cardBody: { flex: 1, gap: 2 },
  name: { fontFamily: Fonts.semibold, fontSize: 16 },
  meta: { fontFamily: Fonts.regular, fontSize: 13 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { fontFamily: Fonts.medium, fontSize: 12 },
  chipMuted: { fontFamily: Fonts.regular, fontSize: 12 },
  empty: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: 6,
  },
  emptyTitle: { fontFamily: Fonts.semibold, fontSize: 16 },
  emptyText: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
});
