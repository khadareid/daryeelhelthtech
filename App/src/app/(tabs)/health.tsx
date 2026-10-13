import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/health/progress-ring';
import { Screen } from '@/components/screen';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';

const DEFAULT_STEPS_GOAL = 10000;
const DEFAULT_WATER_GOAL = 2000;
const DEFAULT_SLEEP_GOAL = 8;
import { useAuth } from '@/context/auth-context';
import { usePedometer } from '@/hooks/use-pedometer';
import { getTodayHealthLog, upsertTodayHealthLog } from '@/lib/api';

type TodayLog = {
  mood?: string | null;
  steps?: number | null;
  waterIntakeMl?: number | null;
  sleepHours?: number | null;
  energyLevel?: string | null;
  activeMinutes?: number | null;
  caloriesBurned?: number | null;
  stepsGoal?: number | null;
  waterGoalMl?: number | null;
  sleepGoalHours?: number | null;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ratio(value: number, goal: number) {
  if (!goal) return 0;
  return Math.max(0, Math.min(1, value / goal));
}

export default function HealthDailyScreen() {
  const { accessToken, profile, user, refreshProfile } = useAuth();
  const [todayLog, setTodayLog] = useState<TodayLog | null>(null);
  const [syncing, setSyncing] = useState(false);

  const seedSteps = todayLog?.steps ?? 0;
  const {
    steps: liveSteps,
    available,
    tracking,
    caloriesFromSteps,
  } = usePedometer(seedSteps);

  const stepsGoal = todayLog?.stepsGoal ?? DEFAULT_STEPS_GOAL;
  const water = todayLog?.waterIntakeMl ?? 0;
  const waterGoal = todayLog?.waterGoalMl ?? DEFAULT_WATER_GOAL;
  const sleep = Number(todayLog?.sleepHours ?? 0);
  const sleepGoal = todayLog?.sleepGoalHours ?? DEFAULT_SLEEP_GOAL;
  const heart = profile?.vitalSigns?.[0]?.heartRate ?? 0;
  const activeMin =
    todayLog?.activeMinutes ?? Math.max(0, Math.round(liveSteps / 120));
  const calories =
    todayLog?.caloriesBurned ?? caloriesFromSteps ?? Math.round(liveSteps * 0.04);

  const firstName = useMemo(
    () => (user?.fullName || profile?.fullName || 'there').split(' ')[0],
    [user?.fullName, profile?.fullName],
  );

  async function load() {
    await refreshProfile();
    if (!accessToken) return;
    const res = await getTodayHealthLog(accessToken);
    setTodayLog((res?.result ?? res?.data ?? null) as TodayLog | null);
  }

  useEffect(() => {
    load();
  }, [accessToken]);

  // Auto-sync pedometer steps to API when signed in
  useEffect(() => {
    if (!accessToken || !tracking || liveSteps <= 0) return;
    const t = setTimeout(async () => {
      setSyncing(true);
      try {
        await upsertTodayHealthLog(accessToken, {
          steps: liveSteps,
          caloriesBurned: Math.round(liveSteps * 0.04),
          source: 'DEVICE',
        });
      } catch {
        /* offline / API optional */
      } finally {
        setSyncing(false);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [accessToken, liveSteps, tracking]);

  async function addWater(ml: number) {
    const next = water + ml;
    setTodayLog((prev) => ({ ...(prev || {}), waterIntakeMl: next }));
    if (!accessToken) return;
    try {
      await upsertTodayHealthLog(accessToken, {
        waterIntakeMl: next,
        source: 'MANUAL',
      });
    } catch {
      /* ignore */
    }
  }

  return (
    <Screen onRefresh={load} headerTitle="Activity">
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>
            {greeting()}, {firstName}
          </Text>
          <Text style={styles.sub}>
            Track your daily activity & stay healthy.
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {firstName.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.autoRow}>
        <Ionicons
          name={tracking ? 'walk' : 'phone-portrait-outline'}
          size={16}
          color={Brand.primary}
        />
        <Text style={styles.autoText}>
          {available === false
            ? 'Auto steps unavailable — using saved log'
            : tracking
              ? 'Automatic step tracking on'
              : 'Connecting motion sensors…'}
          {syncing ? ' · syncing' : ''}
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Walk — hero */}
        <Pressable
          onPress={() => router.push('/health/steps' as Href)}
          style={[styles.walkCard, styles.span2]}>
          <View style={styles.cardTop}>
            <Ionicons name="walk" size={22} color="#fff" />
            <Text style={styles.walkTitle}>Walk</Text>
          </View>
          <ProgressRing
            size={148}
            progress={ratio(liveSteps, stepsGoal)}
            value={liveSteps.toLocaleString()}
            label="Steps"
            icon={<Ionicons name="footsteps" size={20} color="#fff" />}
          />
          <Text style={styles.walkHint}>
            Goal {stepsGoal.toLocaleString()} · Tap for details
          </Text>
        </Pressable>

        <MetricCard
          title="Sleep"
          value={`${sleep.toFixed(1)}`}
          unit="Hours"
          icon="moon"
          accent="#F97316"
          onPress={() => router.push('/health/steps' as Href)}
        />
        <MetricCard
          title="Heart"
          value={`${heart}`}
          unit="bpm"
          icon="heart"
          accent="#EF4444"
          spark
        />
        <MetricCard
          title="Exercise"
          value={`${Math.max(1, Math.round(activeMin / 60)) || activeMin}`}
          unit={activeMin >= 60 ? 'Hours' : 'Min'}
          icon="bicycle"
          accent="#3B82F6"
          bars
        />
        <MetricCard
          title="Calories"
          value={`${Math.round(Number(calories))}`}
          unit="Kcal"
          icon="flame"
          accent="#10B981"
          ring={ratio(Number(calories), 500)}
        />
        <MetricCard
          title="Water"
          value={`${water}`}
          unit="ml"
          icon="water"
          accent="#0EA5E9"
          ring={ratio(water, waterGoal)}
        />
        <MetricCard
          title="Active"
          value={`${activeMin}`}
          unit="Minutes"
          icon="fitness"
          accent="#8B5CF6"
        />
      </View>

      <View style={styles.quick}>
        <Text style={styles.quickTitle}>Quick water</Text>
        <View style={styles.quickRow}>
          {[250, 500, 750].map((ml) => (
            <Pressable
              key={ml}
              onPress={() => addWater(ml)}
              style={styles.quickBtn}>
              <Text style={styles.quickBtnText}>+{ml} ml</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.goalHint}>
          Sleep goal {sleepGoal}h · Water goal {waterGoal} ml
        </Text>
      </View>
    </Screen>
  );
}

function MetricCard({
  title,
  value,
  unit,
  icon,
  accent,
  spark,
  bars,
  ring,
  onPress,
}: {
  title: string;
  value: string;
  unit: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: string;
  spark?: boolean;
  bars?: boolean;
  ring?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.iconBubble, { backgroundColor: `${accent}22` }]}>
          <Ionicons name={icon} size={16} color={accent} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {spark ? <Sparkline color={accent} /> : null}
      {bars ? <MiniBars color={accent} /> : null}
      {typeof ring === 'number' ? (
        <View style={{ alignItems: 'center', marginVertical: 6 }}>
          <ProgressRing
            size={72}
            stroke={8}
            progress={ring}
            trackColor="#E2E8F0"
            tintColor={accent}
            value={value}
            label={unit}
            valueColor={Brand.dark}
            labelColor={Brand.muted}
          />
        </View>
      ) : (
        <>
          <Text style={[styles.cardValue, { color: accent }]}>{value}</Text>
          <Text style={styles.cardUnit}>{unit}</Text>
        </>
      )}
    </Pressable>
  );
}

function Sparkline({ color }: { color: string }) {
  const pts = [8, 14, 10, 16, 12, 18, 11, 15];
  return (
    <View style={styles.spark}>
      {pts.map((h, i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: h,
            borderRadius: 2,
            backgroundColor: color,
            opacity: 0.35 + i * 0.08,
          }}
        />
      ))}
    </View>
  );
}

function MiniBars({ color }: { color: string }) {
  const pts = [10, 16, 12, 20, 14, 18, 11];
  return (
    <View style={styles.spark}>
      {pts.map((h, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: h,
            borderRadius: 3,
            backgroundColor: color,
            opacity: 0.45,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greet: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: Brand.dark,
  },
  sub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  autoText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  span2: {
    width: '100%',
  },
  walkCard: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 10,
  },
  walkTitle: {
    color: '#fff',
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  walkHint: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  card: {
    width: '47.5%',
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    minHeight: 132,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.dark,
  },
  cardValue: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    marginTop: 4,
  },
  cardUnit: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.muted,
  },
  spark: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 22,
    marginBottom: 4,
  },
  quick: {
    marginTop: 8,
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: 10,
  },
  quickTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Brand.dark,
  },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1,
    backgroundColor: Brand.light,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickBtnText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.primary,
  },
  goalHint: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Brand.muted,
  },
});
