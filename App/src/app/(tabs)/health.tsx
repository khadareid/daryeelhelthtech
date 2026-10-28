import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/health/progress-ring';
import { Screen } from '@/components/screen';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useGoogleHealthLink } from '@/hooks/use-google-health';
import { usePedometer } from '@/hooks/use-pedometer';
import { getTodayHealthLog, upsertTodayHealthLog } from '@/lib/api';

const DEFAULT_STEPS_GOAL = 10000;
const DEFAULT_WATER_GOAL = 2000;
const DEFAULT_SLEEP_GOAL = 8;

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
  const { linked, ready, connect, disconnect, openHealthConnect } =
    useGoogleHealthLink();

  const seedSteps = todayLog?.steps ?? 0;
  const {
    steps: liveSteps,
    available,
    tracking,
    caloriesFromSteps,
  } = usePedometer(seedSteps);

  const autoOn = linked && tracking;
  const stepsGoal = todayLog?.stepsGoal ?? DEFAULT_STEPS_GOAL;
  const water = todayLog?.waterIntakeMl ?? 0;
  const waterGoal = todayLog?.waterGoalMl ?? DEFAULT_WATER_GOAL;
  const sleep = Number(todayLog?.sleepHours ?? 0);
  const sleepGoal = todayLog?.sleepGoalHours ?? DEFAULT_SLEEP_GOAL;
  const heart = profile?.vitalSigns?.[0]?.heartRate ?? 0;
  const activeMin =
    todayLog?.activeMinutes ?? Math.max(0, Math.round(liveSteps / 120));
  const calories =
    todayLog?.caloriesBurned ??
    caloriesFromSteps ??
    Math.round(liveSteps * 0.04);

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

  // Auto-sync when Google Health link is on + pedometer tracking
  useEffect(() => {
    if (!accessToken || !linked || !tracking || liveSteps <= 0) return;
    const t = setTimeout(async () => {
      setSyncing(true);
      try {
        await upsertTodayHealthLog(accessToken, {
          steps: liveSteps,
          caloriesBurned: Math.round(liveSteps * 0.04),
          activeMinutes: Math.max(0, Math.round(liveSteps / 120)),
          distanceMeters: Math.round(liveSteps * 0.75),
          source: 'HEALTH_APP',
        });
      } catch {
        /* offline / API optional */
      } finally {
        setSyncing(false);
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [accessToken, liveSteps, tracking, linked]);

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

  const movePct = ratio(liveSteps, stepsGoal);
  const exercisePct = ratio(activeMin, 30);
  const standPct = ratio(water, waterGoal);

  return (
    <Screen onRefresh={load} headerTitle="Health Daily">
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>
            {greeting()}, {firstName}
          </Text>
          <Text style={styles.sub}>
            Activity like Google Health — auto steps, rings & daily sync.
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {firstName.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      </View>

      {ready ? (
        <View style={[styles.linkCard, linked && styles.linkCardOn]}>
          <View style={styles.linkTop}>
            <View style={styles.linkIcon}>
              <Ionicons
                name={linked ? 'checkmark-circle' : 'logo-google'}
                size={22}
                color={linked ? Brand.success : Brand.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>
                {linked ? 'Google Health linked' : 'Link Google Health'}
              </Text>
              <Text style={styles.linkSub}>
                {linked
                  ? autoOn
                    ? `Auto-syncing steps${syncing ? '…' : ''}`
                    : available === false
                      ? 'Sensors unavailable — saved log still syncs'
                      : 'Waiting for motion sensors…'
                  : 'Connect phone activity (Health Connect / Fit sensors)'}
              </Text>
            </View>
          </View>
          <View style={styles.linkActions}>
            {linked ? (
              <>
                <Pressable
                  onPress={() => void openHealthConnect()}
                  style={styles.linkBtnGhost}>
                  <Text style={styles.linkBtnGhostText}>Open Health app</Text>
                </Pressable>
                <Pressable onPress={() => void disconnect()} style={styles.linkBtnGhost}>
                  <Text style={styles.linkBtnGhostText}>Unlink</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => void connect()} style={styles.linkBtn}>
                <Text style={styles.linkBtnText}>Connect automatically</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      {/* Activity rings — Google Fit style */}
      <View style={styles.ringsCard}>
        <Text style={styles.ringsTitle}>Today’s activity</Text>
        <View style={styles.ringsRow}>
          <RingStat
            label="Move"
            value={liveSteps.toLocaleString()}
            unit="steps"
            progress={movePct}
            color="#EA4335"
          />
          <RingStat
            label="Exercise"
            value={`${activeMin}`}
            unit="min"
            progress={exercisePct}
            color="#34A853"
          />
          <RingStat
            label="Hydration"
            value={`${water}`}
            unit="ml"
            progress={standPct}
            color="#4285F4"
          />
        </View>
        <Text style={styles.ringsHint}>
          Goals · {stepsGoal.toLocaleString()} steps · 30 min · {waterGoal} ml
        </Text>
      </View>

      <View style={styles.grid}>
        <Pressable
          onPress={() => router.push('/health/steps' as Href)}
          style={[styles.walkCard, styles.span2]}>
          <View style={styles.cardTop}>
            <Ionicons name="walk" size={22} color="#fff" />
            <Text style={styles.walkTitle}>Steps</Text>
            {autoOn ? (
              <View style={styles.livePill}>
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
            ) : null}
          </View>
          <ProgressRing
            size={148}
            progress={movePct}
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
          value={`${heart || '—'}`}
          unit="bpm"
          icon="heart"
          accent="#EA4335"
          spark
        />
        <MetricCard
          title="Calories"
          value={`${Math.round(Number(calories))}`}
          unit="Kcal"
          icon="flame"
          accent="#FBBC05"
          ring={ratio(Number(calories), 500)}
        />
        <MetricCard
          title="Water"
          value={`${water}`}
          unit="ml"
          icon="water"
          accent="#4285F4"
          ring={ratio(water, waterGoal)}
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
          Sleep goal {sleepGoal}h · Synced from Google Health sensors when linked
        </Text>
      </View>
    </Screen>
  );
}

function RingStat({
  label,
  value,
  unit,
  progress,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  progress: number;
  color: string;
}) {
  return (
    <View style={styles.ringStat}>
      <ProgressRing
        size={88}
        stroke={9}
        progress={progress}
        trackColor="#E8EEF7"
        tintColor={color}
        value={value}
        label={unit}
        valueColor={Brand.dark}
        labelColor={Brand.muted}
      />
      <Text style={[styles.ringLabel, { color }]}>{label}</Text>
    </View>
  );
}

function MetricCard({
  title,
  value,
  unit,
  icon,
  accent,
  spark,
  ring,
  onPress,
}: {
  title: string;
  value: string;
  unit: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: string;
  spark?: boolean;
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
  linkCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: 10,
  },
  linkCardOn: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  linkTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Brand.dark,
  },
  linkSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Brand.muted,
    marginTop: 2,
  },
  linkActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linkBtn: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  linkBtnText: {
    color: '#fff',
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
  linkBtnGhost: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Brand.white,
  },
  linkBtnGhostText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.dark,
  },
  ringsCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 12,
  },
  ringsTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Brand.dark,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  ringStat: { flex: 1, alignItems: 'center', gap: 6 },
  ringLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },
  ringsHint: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Brand.muted,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  span2: { width: '100%' },
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
    flex: 1,
  },
  livePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  livePillText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
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
    width: '100%',
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
