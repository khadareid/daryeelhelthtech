// controllers/dailyHealthLog.controller.ts

import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Calendar day as UTC midnight so @db.Date matches the user's local today.
 * A plain YYYY-MM-DD string is kept as that calendar date.
 */
const getDateOnly = (value?: string | Date) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
};

/**
 * Calculate BMI
 */
const calculateBMI = (
  weightKg?: number | null,
  heightCm?: number | null
) => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;

  return Number((weightKg / (heightM * heightM)).toFixed(2));
};

/**
 * Hydration status
 */
const calculateHydrationStatus = (
  intake: number,
  goal: number
) => {
  if (!goal || goal <= 0) {
    return "NOT_MET";
  }

  const percentage = (intake / goal) * 100;

  if (percentage > 100) return "EXCEEDED";
  if (percentage >= 80) return "MET";
  if (percentage > 0) return "PARTIAL";

  return "NOT_MET";
};

/**
 * Goal status
 */
const calculateGoalStatus = (
  current: number,
  goal: number
) => {
  if (!goal || goal <= 0 || current <= 0) {
    return "NOT_STARTED";
  }

  if (current >= goal) {
    return "COMPLETED";
  }

  return "IN_PROGRESS";
};

/**
 * GET USER ID
 *
 * Adjust this depending on your auth middleware.
 */
const getUserId = (req: Request) => {
  const user = (req as any).user;

  return user?.id || user?.userid || user?.userId;
};

// ============================================================
// CREATE DAILY HEALTH LOG
// ============================================================

export const createDailyHealthLog = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        isSuccess: false, success: false,
        message: "Unauthorized",
      });
    }

    const {
      date,

      // Wellness
      mood,
      sleepQuality,
      stressLevel,
      energyLevel,
      activityLevel,
      painLevel,
      painAreas,
      notes,

      // Activity
      steps,
      distanceKm,
      activeMinutes,
      caloriesBurned,
      floorsClimbed,

      // Body
      weightKg,
      bodyFatPercent,
      muscleMassKg,
      waterPercent,
      bmi,

      // Nutrition
      caloriesIntake,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      sugarG,

      // Hydration
      waterIntakeMl,
      waterGoalMl,

      // Sleep
      sleepHours,
      sleepStart,
      sleepEnd,

      // Wellness activities
      relaxationMinutes,
      meditationMinutes,

      // Goals
      stepsGoal,
      waterGoalMlTarget,
      activeMinutesGoal,
      sleepGoalHours,
      caloriesGoal,

      // Source
      source,
      deviceName,
    } = req.body;

    const logDate = getDateOnly(date);

    // ----------------------------------------------------------
    // CHECK EXISTING DAILY LOG
    // ----------------------------------------------------------

    const existing = await prisma.dailyHealthLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        isSuccess: false, success: false,
        message: "Daily health log already exists for this date",
        data: existing,
      });
    }

    // ----------------------------------------------------------
    // DEFAULT VALUES
    // ----------------------------------------------------------

    const finalSteps = steps ?? 0;
    const finalWaterIntake = waterIntakeMl ?? 0;
    const finalWaterGoal = waterGoalMl ?? 2000;
    const finalActiveMinutes = activeMinutes ?? 0;
    const finalActiveGoal = activeMinutesGoal ?? 30;
    const finalStepsGoal = stepsGoal ?? 10000;
    const finalSleepGoal = sleepGoalHours ?? 8;

    // ----------------------------------------------------------
    // CALCULATIONS
    // ----------------------------------------------------------

    const hydrationStatus = calculateHydrationStatus(
      finalWaterIntake,
      finalWaterGoal
    );

    const stepsGoalStatus = calculateGoalStatus(
      finalSteps,
      finalStepsGoal
    );

    const waterGoalStatus = calculateGoalStatus(
      finalWaterIntake,
      finalWaterGoal
    );

    const activeGoalStatus = calculateGoalStatus(
      finalActiveMinutes,
      finalActiveGoal
    );

    const sleepGoalStatus = calculateGoalStatus(
      sleepHours ?? 0,
      finalSleepGoal
    );

    // ----------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------

    const dailyLog = await prisma.dailyHealthLog.create({
      data: {
        userId,
        date: logDate,

        // Wellness
        mood,
        sleepQuality,
        stressLevel,
        energyLevel,
        activityLevel,
        painLevel,
        painAreas,
        notes,

        // Activity
        steps: finalSteps,
        distanceKm: distanceKm ?? 0,
        activeMinutes: finalActiveMinutes,
        caloriesBurned: caloriesBurned ?? 0,
        floorsClimbed: floorsClimbed ?? 0,

        // Body
        weightKg,
        bodyFatPercent,
        muscleMassKg,
        waterPercent,
        bmi,

        // Nutrition
        caloriesIntake: caloriesIntake ?? 0,
        proteinG,
        carbsG,
        fatG,
        fiberG,
        sugarG,

        // Hydration
        waterIntakeMl: finalWaterIntake,
        waterGoalMl: finalWaterGoal,
        hydrationStatus,

        // Sleep
        sleepHours,
        sleepStart: sleepStart
          ? new Date(sleepStart)
          : undefined,
        sleepEnd: sleepEnd
          ? new Date(sleepEnd)
          : undefined,

        // Wellness activities
        relaxationMinutes: relaxationMinutes ?? 0,
        meditationMinutes: meditationMinutes ?? 0,

        // Goals
        stepsGoal: finalStepsGoal,
        stepsGoalStatus,

        waterGoalMlTarget: finalWaterGoal,
        waterGoalStatus,

        activeMinutesGoal: finalActiveGoal,
        activeGoalStatus,

        sleepGoalHours: finalSleepGoal,
        sleepGoalStatus,

        caloriesGoal,
        calorieGoalStatus:
          caloriesGoal && caloriesGoal > 0
            ? calculateGoalStatus(
                caloriesIntake ?? 0,
                caloriesGoal
              )
            : "NOT_STARTED",

        // Source
        source: source ?? "MANUAL",
        deviceName,
      },
    });

    return res.status(201).json({
      isSuccess: true, success: true,
      message: "Daily health log created successfully",
      data: dailyLog,
    });
  } catch (error: any) {
    console.error(
      "createDailyHealthLog error:",
      error
    );

    return res.status(500).json({
      isSuccess: false, success: false,
      message: "Failed to create daily health log",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// GET TODAY'S DAILY HEALTH LOG
// ============================================================

export const getTodayDailyHealthLog = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        isSuccess: false, success: false,
        message: "Unauthorized",
      });
    }

    const today = getDateOnly();

    const dailyLog = await prisma.dailyHealthLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    return res.status(200).json({
      isSuccess: true, success: true,
      data: dailyLog,
    });
  } catch (error) {
    console.error(
      "getTodayDailyHealthLog error:",
      error
    );

    return res.status(500).json({
      isSuccess: false, success: false,
      message: "Failed to get today's health log",
    });
  }
};

// ============================================================
// GET DAILY HEALTH LOG BY DATE
// ============================================================

export const getDailyHealthLogByDate = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    const { date } = req.params;

    if (!userId) {
      return res.status(401).json({
        isSuccess: false, success: false,
        message: "Unauthorized",
      });
    }

    const logDate = getDateOnly(date);

    const dailyLog = await prisma.dailyHealthLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
    });

    if (!dailyLog) {
      return res.status(404).json({
        isSuccess: false, success: false,
        message: "Daily health log not found",
      });
    }

    return res.status(200).json({
      isSuccess: true, success: true,
      data: dailyLog,
    });
  } catch (error) {
    console.error(
      "getDailyHealthLogByDate error:",
      error
    );

    return res.status(500).json({
      isSuccess: false, success: false,
      message: "Failed to get daily health log",
    });
  }
};

// ============================================================
// GET DAILY HEALTH HISTORY
// ============================================================

export const getDailyHealthHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        isSuccess: false, success: false,
        message: "Unauthorized",
      });
    }

    const limit = Math.min(
      Number(req.query.limit) || 30,
      365
    );

    const logs = await prisma.dailyHealthLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
    });

    return res.status(200).json({
      isSuccess: true, success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(
      "getDailyHealthHistory error:",
      error
    );

    return res.status(500).json({
      isSuccess: false, success: false,
      message: "Failed to get health history",
    });
  }
};

// ============================================================
// UPDATE DAILY HEALTH LOG
// ============================================================

export const updateDailyHealthLog = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    const { date } = req.params;

    if (!userId) {
      return res.status(401).json({
        isSuccess: false, success: false,
        message: "Unauthorized",
      });
    }

    const logDate = getDateOnly(date);

    const existing = await prisma.dailyHealthLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        isSuccess: false, success: false,
        message: "Daily health log not found",
      });
    }

    const {
      mood,
      sleepQuality,
      stressLevel,
      energyLevel,
      activityLevel,
      painLevel,
      painAreas,
      notes,

      steps,
      distanceKm,
      activeMinutes,
      caloriesBurned,
      floorsClimbed,

      weightKg,
      bodyFatPercent,
      muscleMassKg,
      waterPercent,
      bmi,

      caloriesIntake,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      sugarG,

      waterIntakeMl,
      waterGoalMl,

      sleepHours,
      sleepStart,
      sleepEnd,

      relaxationMinutes,
      meditationMinutes,

      stepsGoal,
      waterGoalMlTarget,
      activeMinutesGoal,
      sleepGoalHours,
      caloriesGoal,

      source,
      deviceName,
    } = req.body;

    const finalSteps =
      steps ?? existing.steps;

    const finalWaterIntake =
      waterIntakeMl ?? existing.waterIntakeMl;

    const finalWaterGoal =
      waterGoalMl ??
      waterGoalMlTarget ??
      existing.waterGoalMl;

    const finalActiveMinutes =
      activeMinutes ?? existing.activeMinutes;

    const finalActiveGoal =
      activeMinutesGoal ??
      existing.activeMinutesGoal;

    const finalStepsGoal =
      stepsGoal ?? existing.stepsGoal;

    const finalSleepHours =
      sleepHours ?? existing.sleepHours;

    const finalSleepGoal =
      sleepGoalHours ?? existing.sleepGoalHours;

    const finalCaloriesIntake =
      caloriesIntake ?? existing.caloriesIntake;

    const finalCaloriesGoal =
      caloriesGoal ?? existing.caloriesGoal;

    const updatedLog =
      await prisma.dailyHealthLog.update({
        where: {
          userId_date: {
            userId,
            date: logDate,
          },
        },

        data: {
          mood,
          sleepQuality,
          stressLevel,
          energyLevel,
          activityLevel,
          painLevel,
          painAreas,
          notes,

          steps,
          distanceKm,
          activeMinutes,
          caloriesBurned,
          floorsClimbed,

          weightKg,
          bodyFatPercent,
          muscleMassKg,
          waterPercent,
          bmi,

          caloriesIntake,
          proteinG,
          carbsG,
          fatG,
          fiberG,
          sugarG,

          waterIntakeMl,
          waterGoalMl,

          hydrationStatus:
            calculateHydrationStatus(
              finalWaterIntake,
              finalWaterGoal
            ),

          sleepHours,

          sleepStart: sleepStart
            ? new Date(sleepStart)
            : undefined,

          sleepEnd: sleepEnd
            ? new Date(sleepEnd)
            : undefined,

          relaxationMinutes,
          meditationMinutes,

          stepsGoal,

          stepsGoalStatus:
            calculateGoalStatus(
              finalSteps,
              finalStepsGoal
            ),

          waterGoalMlTarget:

            waterGoalMlTarget ??
            existing.waterGoalMlTarget,

          waterGoalStatus:
            calculateGoalStatus(
              finalWaterIntake,
              finalWaterGoal
            ),

          activeMinutesGoal,

          activeGoalStatus:
            calculateGoalStatus(
              finalActiveMinutes,
              finalActiveGoal
            ),

          sleepGoalHours,

          sleepGoalStatus:
            calculateGoalStatus(
              finalSleepHours ?? 0,
              finalSleepGoal
            ),

          caloriesGoal,

          calorieGoalStatus:
            finalCaloriesGoal
              ? calculateGoalStatus(
                  finalCaloriesIntake,
                  finalCaloriesGoal
                )
              : "NOT_STARTED",

          source,
          deviceName,
        },
      });

    return res.status(200).json({
      isSuccess: true, success: true,
      message: "Daily health log updated successfully",
      data: updatedLog,
    });
  } catch (error: any) {
    console.error(
      "updateDailyHealthLog error:",
      error
    );

    return res.status(500).json({
      isSuccess: false, success: false,
      message: "Failed to update daily health log",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// DELETE DAILY HEALTH LOG
// ============================================================

export const deleteDailyHealthLog = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);
    const { date } = req.params;

    if (!userId) {
      return res.status(401).json({
        isSuccess: false, success: false,
        message: "Unauthorized",
      });
    }

    const logDate = getDateOnly(date);

    const existing = await prisma.dailyHealthLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        isSuccess: false, success: false,
        message: "Daily health log not found",
      });
    }

    await prisma.dailyHealthLog.delete({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
    });

    return res.status(200).json({
      isSuccess: true, success: true,
      message: "Daily health log deleted successfully",
    });
  } catch (error) {
    console.error(
      "deleteDailyHealthLog error:",
      error
    );

    return res.status(500).json({
      isSuccess: false, success: false,
      message: "Failed to delete daily health log",
    });
  }
};