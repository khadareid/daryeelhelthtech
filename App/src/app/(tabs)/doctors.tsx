import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { ListSkeleton } from '@/components/skeleton';
import {
  CATEGORIES,
  specialtyMatchesCategory,
} from '@/constants/content';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useDoctors } from '@/hooks/use-doctors';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

export default function DoctorsScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const { doctors, refresh, loading } = useDoctors();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const compact = responsive.isPhone;
  const cols = responsive.gridColumns > 1 ? Math.min(responsive.gridColumns, 2) : 1;
  const cardWidth =
    cols === 1
      ? '100%'
      : (responsive.contentWidth - responsive.gap) / cols;

  const filtered = useMemo(() => {
    return doctors.filter((doctor) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        doctor.name.toLowerCase().includes(q) ||
        doctor.specialty.toLowerCase().includes(q) ||
        doctor.city.toLowerCase().includes(q) ||
        doctor.clinicName.toLowerCase().includes(q);

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
      headerTitle="Daryeel doctors"
      headerSubtitle="Book a clinician">
      <LinearGradient
        colors={[Brand.primary, '#0B3D91']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Clinicians</Text>
        <Text style={[styles.title, { fontSize: responsive.titleSize }]}>
          Daryeel doctors
        </Text>
        <Text style={styles.heroSub}>
          Browse verified clinicians by specialty, clinic, and availability —
          then book a visit.
        </Text>
        <View style={styles.statsRow}>
          <MiniStat
            label="Clinicians"
            value={String(doctors.length)}
            compact={compact}
            light
          />
          <MiniStat
            label="Available"
            value={String(availableCount)}
            compact={compact}
            light
          />
          <MiniStat
            label="Specialties"
            value={String(CATEGORIES.length - 1)}
            compact={compact}
            light
          />
        </View>
      </LinearGradient>

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
          placeholder="Search name, specialty, clinic"
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
        <Text
          style={{
            color: theme.textSecondary,
            fontFamily: Fonts.medium,
            fontSize: 12,
          }}>
          {filtered.length} found
        </Text>
      </View>

      {loading && doctors.length === 0 ? <ListSkeleton rows={4} /> : null}

      <View style={[styles.list, { gap: responsive.gap }]}>
        {filtered.map((doctor) => (
          <View key={doctor.id} style={{ width: cardWidth }}>
            <DoctorListCard
              doctor={doctor}
              onPress={() => router.push(`/doctor/${doctor.id}` as Href)}
            />
          </View>
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
  compact,
  light,
}: {
  label: string;
  value: string;
  compact: boolean;
  light?: boolean;
}) {
  return (
    <View
      style={[
        styles.stat,
        {
          backgroundColor: light ? 'rgba(255,255,255,0.16)' : Brand.light,
          paddingHorizontal: compact ? 10 : 14,
        },
      ]}>
      <Text
        style={[styles.statValue, { color: light ? Brand.white : Brand.dark }]}>
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          { color: light ? 'rgba(255,255,255,0.85)' : Brand.muted },
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: Radius.xl,
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
  title: { fontFamily: Fonts.bold, color: Brand.white },
  heroSub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  stat: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontFamily: Fonts.bold, fontSize: 16 },
  statLabel: { fontFamily: Fonts.medium, fontSize: 11, marginTop: 2 },
  searchBox: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
  },
  searchInput: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    paddingVertical: 12,
  },
  sectionLabel: { fontFamily: Fonts.semibold, fontSize: 15 },
  filters: { gap: 8, paddingVertical: 2 },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontFamily: Fonts.medium, fontSize: 12 },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: { flexDirection: 'row', flexWrap: 'wrap' },
  empty: { fontFamily: Fonts.regular, fontSize: 13, paddingVertical: 12 },
});
