import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { DoctorListCard } from '@/components/doctor-list-card';
import { Screen } from '@/components/screen';
import { ListSkeleton } from '@/components/skeleton';
import {
  CATEGORIES,
  specialtyMatchesCategory,
} from '@/constants/content';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useDoctors } from '@/hooks/use-doctors';
import { useTheme } from '@/hooks/use-theme';

export default function DoctorsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { doctors, refresh, loading } = useDoctors();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const compact = width < 380;

  const filtered = useMemo(() => {
    return doctors.filter((doctor) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        doctor.name.toLowerCase().includes(q) ||
        doctor.specialty.toLowerCase().includes(q) ||
        doctor.city.toLowerCase().includes(q) ||
        doctor.hospitalName.toLowerCase().includes(q);

      return (
        matchesQuery && specialtyMatchesCategory(doctor.specialty, category)
      );
    });
  }, [doctors, query, category]);

  const availableCount = doctors.filter((d) => d.availableToday).length;

  return (
    <Screen
      onRefresh={refresh}
      refreshing={loading}
      headerTitle="Doctors">
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.title, { color: theme.brandDark }]}>
          Find a doctor
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Browse live clinicians by specialty, hospital, and availability.
        </Text>
        <View style={styles.statsRow}>
          <MiniStat
            label="Clinicians"
            value={String(doctors.length)}
            theme={theme}
            compact={compact}
          />
          <MiniStat
            label="Available"
            value={String(availableCount)}
            theme={theme}
            compact={compact}
          />
          <MiniStat
            label="Specialties"
            value={String(CATEGORIES.length - 1)}
            theme={theme}
            compact={compact}
          />
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
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, specialty, hospital"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: theme.brandDark }]}>
        Specialties
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        {CATEGORIES.map((item) => {
          const active = item.id === category;
          return (
            <Pressable
              key={item.id}
              onPress={() => setCategory(item.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? theme.primary
                    : theme.backgroundElement,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  { color: active ? '#FFFFFF' : theme.textSecondary },
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listHead}>
        <Text style={[styles.sectionLabel, { color: theme.brandDark }]}>
          Profiles & ratings
        </Text>
        <Text style={{ color: theme.textSecondary, fontFamily: Fonts.medium, fontSize: 12 }}>
          {filtered.length} found
        </Text>
      </View>

      <View style={styles.list}>
        {loading && filtered.length === 0 ? <ListSkeleton rows={5} /> : null}
        {filtered.map((doctor) => (
          <DoctorListCard
            key={doctor.id}
            doctor={doctor}
            onPress={() => router.push(`/doctor/${doctor.id}` as Href)}
          />
        ))}
        {!loading && filtered.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            No doctors match your search.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

function MiniStat({
  label,
  value,
  theme,
  compact,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
  compact: boolean;
}) {
  return (
    <View
      style={[
        styles.miniStat,
        {
          backgroundColor: theme.backgroundSelected,
          paddingVertical: compact ? 8 : 10,
        },
      ]}>
      <Text style={[styles.miniValue, { color: theme.brandDark }]}>{value}</Text>
      <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 26,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  miniStat: {
    flex: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: 2,
  },
  miniValue: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  miniLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
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
  sectionLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  filters: {
    gap: Spacing.two,
    paddingRight: Spacing.two,
  },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  apptRow: {
    gap: Spacing.three,
    paddingRight: Spacing.two,
  },
  apptCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: 3,
  },
  apptName: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  apptMeta: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  apptStatus: {
    marginTop: 6,
    alignSelf: 'flex-start',
    fontFamily: Fonts.medium,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: Spacing.three,
  },
  empty: {
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
