import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StackScreen } from '@/components/stack-screen';
import { CardListSkeleton, DetailSkeleton } from '@/components/skeleton';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  getHealthcareHospital,
  healthcareDoctorId,
  healthcareDoctorName,
  healthcareHospitalName,
  listHealthcareDepartments,
  listHealthcareDoctors,
  type HealthcareDepartment,
  type HealthcareDoctor,
  type HealthcareHospital,
} from '@/lib/api';

const DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80';

export default function HealthcareHospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { accessToken } = useAuth();
  const [hospital, setHospital] = useState<HealthcareHospital | null>(null);
  const [doctors, setDoctors] = useState<HealthcareDoctor[]>([]);
  const [departments, setDepartments] = useState<HealthcareDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [h, docs, deps] = await Promise.all([
        getHealthcareHospital(id, accessToken),
        listHealthcareDoctors(accessToken, { hospitalId: id, limit: 50 }),
        listHealthcareDepartments(id, accessToken),
      ]);
      setHospital(h);
      setDoctors(docs.length ? docs : h.doctors || []);
      setDepartments(deps);
    } catch {
      setHospital(null);
      setDoctors([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !hospital) {
    return (
      <StackScreen title="Hospital" showHeader={false}>
        <DetailSkeleton />
      </StackScreen>
    );
  }

  if (!hospital) {
    return (
      <StackScreen title="Hospital" showHeader={false}>
        <View style={styles.missing}>
          <Text style={{ color: theme.textSecondary, fontFamily: Fonts.medium }}>
            Hospital not found.
          </Text>
        </View>
      </StackScreen>
    );
  }

  const name = healthcareHospitalName(hospital);
  const description =
    hospital.publicDescription || hospital.description || null;

  return (
    <StackScreen
      title={name}
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
        <Text style={[styles.title, { color: theme.brandDark }]}>{name}</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {[hospital.city, hospital.country, hospital.address]
            .filter(Boolean)
            .join(' · ') || 'Partner hospital'}
        </Text>
        {hospital.phone ? (
          <Text style={[styles.meta, { color: theme.primary }]}>
            {hospital.phone}
          </Text>
        ) : null}
        {description ? (
          <Text style={[styles.about, { color: theme.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>

      {departments.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.brandDark }]}>
            Departments
          </Text>
          <View style={styles.tags}>
            {departments.slice(0, 12).map((dep) => (
              <View
                key={dep.departmentId || dep.id || dep.name}
                style={[
                  styles.tag,
                  { backgroundColor: theme.backgroundSelected },
                ]}>
                <Text style={[styles.tagText, { color: theme.primary }]}>
                  {dep.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.brandDark }]}>
          Doctors
        </Text>
        <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
          Choose a clinician to request a hospital appointment.
        </Text>
      </View>

      <View style={styles.list}>
        {loading && doctors.length === 0 ? <CardListSkeleton rows={3} /> : null}
        {doctors.map((doctor) => {
          const doctorId = healthcareDoctorId(doctor);
          if (!doctorId) return null;
          const doctorName = healthcareDoctorName(doctor);
          const specialty =
            doctor.specialization ||
            doctor.specialty ||
            doctor.department?.name ||
            'General';
          const fee = Number(doctor.consultationFee ?? 0);
          const photo =
            doctor.publicPhotoUrl ||
            doctor.picture ||
            doctor.user?.picture ||
            DEFAULT_PHOTO;

          return (
            <Pressable
              key={doctorId}
              onPress={() =>
                router.push(
                  `/healthcare/book?hospitalId=${encodeURIComponent(String(id))}&doctorId=${encodeURIComponent(doctorId)}` as Href,
                )
              }
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}>
              <Image source={photo} style={styles.photo} contentFit="cover" />
              <View style={styles.cardBody}>
                <Text style={[styles.name, { color: theme.brandDark }]}>
                  {doctorName}
                </Text>
                <Text style={[styles.specialty, { color: theme.primary }]}>
                  {specialty}
                </Text>
                {doctor.facilityName ? (
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>
                    {doctor.facilityName}
                  </Text>
                ) : null}
                <Text style={[styles.fee, { color: theme.brandDark }]}>
                  {fee > 0
                    ? `${doctor.currency || 'USD'} ${fee.toFixed(2)}`
                    : 'Fee set by hospital'}
                </Text>
              </View>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.primary}
              />
            </Pressable>
          );
        })}

        {!loading && doctors.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.emptyTitle, { color: theme.brandDark }]}>
              No doctors listed
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              This hospital has no bookable doctors right now.
            </Text>
          </View>
        ) : null}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: 6,
  },
  title: { fontFamily: Fonts.bold, fontSize: 24 },
  meta: { fontFamily: Fonts.regular, fontSize: 13 },
  about: {
    marginTop: 6,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  section: { gap: 4, marginTop: Spacing.two },
  sectionTitle: { fontFamily: Fonts.semibold, fontSize: 17 },
  sectionHint: { fontFamily: Fonts.regular, fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { fontFamily: Fonts.medium, fontSize: 12 },
  list: { gap: Spacing.three, marginTop: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Brand.light,
  },
  cardBody: { flex: 1, gap: 2 },
  name: { fontFamily: Fonts.semibold, fontSize: 16 },
  specialty: { fontFamily: Fonts.medium, fontSize: 13 },
  fee: { fontFamily: Fonts.medium, fontSize: 12, marginTop: 2 },
  empty: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: 6,
  },
  emptyTitle: { fontFamily: Fonts.semibold, fontSize: 16 },
  emptyText: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
});
