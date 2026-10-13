import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressRing } from '@/components/health/progress-ring';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePedometer } from '@/hooks/use-pedometer';
import { getTodayHealthLog } from '@/lib/api';

/** Approximate hourly distribution for today's chart (Health-style). */
function hourlyBars(total: number) {
  const weights = [0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.12, 0.1, 0.08, 0.08, 0.06];
  return weights.map((w) => Math.round(total * w));
}

export default function StepTrackerScreen() {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [seed, setSeed] = useState(0);
  const [goal, setGoal] = useState(10000);
  const { steps, caloriesFromSteps, tracking, available } = usePedometer(seed);
  const bars = useMemo(() => hourlyBars(steps), [steps]);
  const maxBar = Math.max(...bars, 1);

  useEffect(() => {
    (async () => {
      if (!accessToken) return;
      const res = await getTodayHealthLog(accessToken);
      const log = (res?.result ?? res?.data) as {
        steps?: number;
        stepsGoal?: number;
      } | null;
      if (log?.steps) setSeed(log.steps);
      if (log?.stepsGoal) setGoal(log.stepsGoal);
    })();
  }, [accessToken]);

  const insight =
    steps >= goal
      ? 'You hit today’s step goal — great consistency.'
      : steps >= goal * 0.7
        ? 'You’re close to your goal. A short evening walk will get you there.'
        : 'A few short walks today will lift your weekly average.';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Brand.dark} />
        </Pressable>
        <Text style={styles.title}>Step Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.lead}>
        You have walked {steps.toLocaleString()} steps today.
      </Text>

      <View style={styles.gaugeCard}>
        <ProgressRing
          size={200}
          stroke={16}
          progress={Math.min(1, steps / goal)}
          trackColor="#E2E8F0"
          tintColor={Brand.success}
          value={steps.toLocaleString()}
          label="Steps"
          valueColor={Brand.dark}
          labelColor={Brand.muted}
          icon={<Ionicons name="footsteps" size={28} color={Brand.primary} />}
        />
        <View style={styles.metaRow}>
          <Meta
            label="Cal burned"
            value={`${caloriesFromSteps} Cal`}
          />
          <Meta label="Daily goal" value={`${goal.toLocaleString()} Step`} />
        </View>
        <Text style={styles.auto}>
          {available === false
            ? 'Sensor unavailable on this device'
            : tracking
              ? 'Updating automatically from your phone'
              : 'Waiting for motion permission…'}
        </Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsHead}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <Text style={styles.todayChip}>Today</Text>
        </View>
        <View style={styles.chart}>
          {bars.map((v, i) => (
            <View key={i} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  {
                    height: 20 + (v / maxBar) * 90,
                    backgroundColor: i % 3 === 0 ? '#FDBA74' : '#FB923C',
                  },
                ]}
              />
            </View>
          ))}
        </View>
        <View style={styles.axis}>
          <Text style={styles.axisText}>☀️ 6 AM</Text>
          <Text style={styles.axisText}>12 PM</Text>
          <Text style={styles.axisText}>🌙 6 PM</Text>
        </View>
      </View>

      <View style={styles.insight}>
        <Text style={styles.insightTitle}>Insight</Text>
        <Text style={styles.insightBody}>{insight}</Text>
      </View>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Brand.dark,
  },
  lead: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Brand.muted,
    textAlign: 'center',
  },
  gaugeCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  meta: {
    flex: 1,
    backgroundColor: Brand.light,
    borderRadius: Radius.md,
    padding: 12,
  },
  metaLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Brand.muted,
  },
  metaValue: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Brand.dark,
    marginTop: 2,
  },
  auto: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Brand.muted,
  },
  statsCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  statsHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Brand.dark,
  },
  todayChip: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.primary,
    backgroundColor: Brand.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  axis: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.muted,
  },
  insight: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  insightTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Brand.dark,
  },
  insightBody: {
    marginTop: 6,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: Brand.muted,
  },
});
