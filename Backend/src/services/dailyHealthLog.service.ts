import {
  ActivityLevel,
  DailyLogSource,
  EnergyLevel,
  GoalStatus,
  HydrationStatus,
  MoodLevel,
  PainLevel,
  Prisma,
  SleepQuality,
  StressLevel,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/ownership";
import { pageMeta, parsePagination } from "../utils/pagination";
import {
  optionalString,
  parseEnum,
  parseNumber,
} from "../utils/validation";

const getDateOnly = (value?: string | Date) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) throw new HttpError(400, "Invalid date");
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

const calcHydration = (intake: number, goal: number): HydrationStatus => {
  if (!goal || goal <= 0) return HydrationStatus.NOT_MET;
  const pct = (intake / goal) * 100;
  if (pct > 100) return HydrationStatus.EXCEEDED;
  if (pct >= 80) return HydrationStatus.MET;
  if (pct > 0) return HydrationStatus.PARTIAL;
  return HydrationStatus.NOT_MET;
};

const calcGoal = (current: number, goal: number): GoalStatus => {
  if (!goal || goal <= 0 || current <= 0) return GoalStatus.NOT_STARTED;
  if (current >= goal) return GoalStatus.COMPLETED;
  return GoalStatus.IN_PROGRESS;
};

export const listDailyHealthLogs = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.DailyHealthLogWhereInput = { userId };
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = getDateOnly(String(query.from));
    if (query.to) where.date.lte = getDateOnly(String(query.to));
  }

  const [items, total] = await Promise.all([
    prisma.dailyHealthLog.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take,
    }),
    prisma.dailyHealthLog.count({ where }),
  ]);

  return { items, meta: pageMeta(total, page, limit) };
};

export const getDailyHealthLog = async (userId: string, id: string) => {
  const row = await prisma.dailyHealthLog.findFirst({ where: { id, userId } });
  if (!row) throw new HttpError(404, "Daily health log not found");
  return row;
};

export const upsertDailyHealthLog = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const date = getDateOnly(
    typeof body.date === "string" || body.date instanceof Date
      ? body.date
      : undefined
  );

  const steps = parseNumber(body.steps, "steps") ?? 0;
  const stepsGoal = parseNumber(body.stepsGoal, "stepsGoal") ?? 10000;
  const waterIntakeMl = parseNumber(body.waterIntakeMl, "waterIntakeMl") ?? 0;
  const waterGoalMl = parseNumber(body.waterGoalMl, "waterGoalMl") ?? 2000;
  const activeMinutes = parseNumber(body.activeMinutes, "activeMinutes") ?? 0;
  const activeMinutesGoal =
    parseNumber(body.activeMinutesGoal, "activeMinutesGoal") ?? 30;
  const sleepHours = parseNumber(body.sleepHours, "sleepHours") ?? null;
  const sleepGoalHours = parseNumber(body.sleepGoalHours, "sleepGoalHours") ?? 8;

  const data: Prisma.DailyHealthLogUncheckedCreateInput = {
    userId,
    date,
    mood: parseEnum(body.mood, Object.values(MoodLevel), "mood") ?? null,
    sleepQuality:
      parseEnum(body.sleepQuality, Object.values(SleepQuality), "sleepQuality") ??
      null,
    stressLevel:
      parseEnum(body.stressLevel, Object.values(StressLevel), "stressLevel") ??
      null,
    energyLevel:
      parseEnum(body.energyLevel, Object.values(EnergyLevel), "energyLevel") ??
      null,
    activityLevel:
      parseEnum(
        body.activityLevel,
        Object.values(ActivityLevel),
        "activityLevel"
      ) ?? null,
    painLevel:
      parseEnum(body.painLevel, Object.values(PainLevel), "painLevel") ?? null,
    notes: optionalString(body.notes) ?? null,
    steps,
    distanceKm: parseNumber(body.distanceKm, "distanceKm") ?? 0,
    activeMinutes,
    caloriesBurned: parseNumber(body.caloriesBurned, "caloriesBurned") ?? 0,
    heartRateAvg: parseNumber(body.heartRateAvg, "heartRateAvg") ?? null,
    heartRateMin: parseNumber(body.heartRateMin, "heartRateMin") ?? null,
    heartRateMax: parseNumber(body.heartRateMax, "heartRateMax") ?? null,
    weightKg: parseNumber(body.weightKg, "weightKg") ?? null,
    bodyFatPercent: parseNumber(body.bodyFatPercent, "bodyFatPercent") ?? null,
    bmi: parseNumber(body.bmi, "bmi") ?? null,
    oxygenSaturation:
      parseNumber(body.oxygenSaturation, "oxygenSaturation") ?? null,
    waterIntakeMl,
    waterGoalMl,
    hydrationStatus: calcHydration(waterIntakeMl, waterGoalMl),
    sleepHours,
    sleepStart: body.sleepStart ? new Date(String(body.sleepStart)) : null,
    sleepEnd: body.sleepEnd ? new Date(String(body.sleepEnd)) : null,
    stepsGoal,
    stepsGoalStatus: calcGoal(steps, stepsGoal),
    waterGoalStatus: calcGoal(waterIntakeMl, waterGoalMl),
    activeMinutesGoal,
    activeGoalStatus: calcGoal(activeMinutes, activeMinutesGoal),
    sleepGoalHours,
    sleepGoalStatus: calcGoal(sleepHours ?? 0, sleepGoalHours),
    source:
      parseEnum(body.source, Object.values(DailyLogSource), "source") ||
      DailyLogSource.MANUAL,
    deviceName: optionalString(body.deviceName) ?? null,
  };

  return prisma.dailyHealthLog.upsert({
    where: { userId_date: { userId, date } },
    create: data,
    update: data,
  });
};

export const deleteDailyHealthLog = async (userId: string, id: string) => {
  await getDailyHealthLog(userId, id);
  return prisma.dailyHealthLog.delete({ where: { id } });
};
