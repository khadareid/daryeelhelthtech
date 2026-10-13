import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Screen } from '@/components/screen';
import { ListSkeleton } from '@/components/skeleton';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useHospitals } from '@/hooks/use-hospitals';
import { useTheme } from '@/hooks/use-theme';
import {
  hospitalAbout,
  hospitalCover,
  type PublicHospital,
} from '@/types/hospital';

export default function HospitalsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const { hospitals, loading, error, refresh, pagination } = useHospitals(
    9,
    debounced || undefined,
  );
  const cardWidth = width < 380 ? '100%' : '48%';

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Screen
      onRefresh={() => refresh(debounced || undefined, 1)}
      refreshing={loading}
      headerTitle="Hospitals">
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.title, { color: theme.brandDark }]}>
          Hospitals & clinics
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Real facilities from the Daryeel SaaS API — ratings, cities, doctors,
          and contact details.
        </Text>
        {pagination ? (
          <Text style={[styles.count, { color: theme.primary }]}>
            {pagination.total} facilities online
          </Text>
        ) : null}
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
          value={query}
          onChangeText={setQuery}
          placeholder="Search hospital, city, country..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          onSubmitEditing={() => refresh(query.trim() || undefined, 1)}
        />
      </View>

      {loading && hospitals.length === 0 ? <ListSkeleton rows={4} /> : null}

      {error ? (
        <View
          style={[
            styles.errorCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <Text style={[styles.errorTitle, { color: theme.brandDark }]}>
            Couldn’t load hospitals
          </Text>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            {error}
          </Text>
          <Pressable onPress={() => refresh(debounced || undefined, 1)}>
            <Text style={[styles.retry, { color: theme.primary }]}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.grid}>
        {hospitals.map((hospital) => (
          <HospitalCard
            key={hospital.tenantId}
            hospital={hospital}
            width={cardWidth}
            theme={theme}
          />
        ))}
      </View>

      {!loading && !error && hospitals.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          No hospitals match your search.
        </Text>
      ) : null}
    </Screen>
  );
}

function HospitalCard({
  hospital,
  width,
  theme,
}: {
  hospital: PublicHospital;
  width: `${number}%` | '100%';
  theme: ReturnType<typeof useTheme>;
}) {
  const doctors = hospital._count?.professionalProfiles;
  return (
    <Pressable
      onPress={() =>
        router.push(`/hospital/${hospital.tenantId}` as Href)
      }
      style={[
        styles.card,
        {
          width,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <Image
        source={hospitalCover(hospital)}
        style={styles.cover}
        contentFit="cover"
      />
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.brandDark }]} numberOfLines={2}>
          {hospital.companyName}
        </Text>
        <Text style={[styles.meta, { color: theme.primary }]} numberOfLines={1}>
          {[hospital.city, hospital.country].filter(Boolean).join(' · ') ||
            'Location TBA'}
        </Text>
        <Text
          style={[styles.about, { color: theme.textSecondary }]}
          numberOfLines={2}>
          {hospitalAbout(hospital)}
        </Text>
        <Text style={[styles.rating, { color: theme.primary }]}>
          ★ {Number(hospital.rating || 0).toFixed(1)}
          {typeof doctors === 'number' ? ` · ${doctors} doctors` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  count: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 120,
  },
  body: {
    padding: Spacing.three,
    gap: 4,
  },
  name: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
  meta: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  about: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  rating: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  errorCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  errorTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  retry: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    marginTop: 4,
  },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
