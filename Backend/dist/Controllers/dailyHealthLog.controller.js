"use strict";
// controllers/dailyHealthLog.controller.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDailyHealthLog = exports.updateDailyHealthLog = exports.getDailyHealthHistory = exports.getDailyHealthLogByDate = exports.getTodayDailyHealthLog = exports.createDailyHealthLog = void 0;
const prisma_1 = require("../lib/prisma");
/**
 * Calendar day as UTC midnight so @db.Date matches the user's local today.
 * A plain YYYY-MM-DD string is kept as that calendar date.
 */
const getDateOnly = (value) => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date");
    }
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};
/**
 * Calculate BMI
 */
const calculateBMI = (weightKg, heightCm) => {
    if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
        return null;
    }
    const heightM = heightCm / 100;
    return Number((weightKg / (heightM * heightM)).toFixed(2));
};
/**
 * Hydration status
 */
const calculateHydrationStatus = (intake, goal) => {
    if (!goal || goal <= 0) {
        return "NOT_MET";
    }
    const percentage = (intake / goal) * 100;
    if (percentage > 100)
        return "EXCEEDED";
    if (percentage >= 80)
        return "MET";
    if (percentage > 0)
        return "PARTIAL";
    return "NOT_MET";
};
/**
 * Goal status
 */
const calculateGoalStatus = (current, goal) => {
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
const getUserId = (req) => {
    const user = req.user;
    return (user === null || user === void 0 ? void 0 : user.id) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.userId);
};
// ============================================================
// CREATE DAILY HEALTH LOG
// ============================================================
const createDailyHealthLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({
                isSuccess: false, success: false,
                message: "Unauthorized",
            });
        }
        const { date, 
        // Wellness
        mood, sleepQuality, stressLevel, energyLevel, activityLevel, painLevel, painAreas, notes, 
        // Activity
        steps, distanceKm, activeMinutes, caloriesBurned, floorsClimbed, 
        // Body
        weightKg, bodyFatPercent, muscleMassKg, waterPercent, bmi, 
        // Nutrition
        caloriesIntake, proteinG, carbsG, fatG, fiberG, sugarG, 
        // Hydration
        waterIntakeMl, waterGoalMl, 
        // Sleep
        sleepHours, sleepStart, sleepEnd, 
        // Wellness activities
        relaxationMinutes, meditationMinutes, 
        // Goals
        stepsGoal, waterGoalMlTarget, activeMinutesGoal, sleepGoalHours, caloriesGoal, 
        // Source
        source, deviceName, } = req.body;
        const logDate = getDateOnly(date);
        // ----------------------------------------------------------
        // CHECK EXISTING DAILY LOG
        // ----------------------------------------------------------
        const existing = yield prisma_1.prisma.dailyHealthLog.findUnique({
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
        const finalSteps = steps !== null && steps !== void 0 ? steps : 0;
        const finalWaterIntake = waterIntakeMl !== null && waterIntakeMl !== void 0 ? waterIntakeMl : 0;
        const finalWaterGoal = waterGoalMl !== null && waterGoalMl !== void 0 ? waterGoalMl : 2000;
        const finalActiveMinutes = activeMinutes !== null && activeMinutes !== void 0 ? activeMinutes : 0;
        const finalActiveGoal = activeMinutesGoal !== null && activeMinutesGoal !== void 0 ? activeMinutesGoal : 30;
        const finalStepsGoal = stepsGoal !== null && stepsGoal !== void 0 ? stepsGoal : 10000;
        const finalSleepGoal = sleepGoalHours !== null && sleepGoalHours !== void 0 ? sleepGoalHours : 8;
        // ----------------------------------------------------------
        // CALCULATIONS
        // ----------------------------------------------------------
        const hydrationStatus = calculateHydrationStatus(finalWaterIntake, finalWaterGoal);
        const stepsGoalStatus = calculateGoalStatus(finalSteps, finalStepsGoal);
        const waterGoalStatus = calculateGoalStatus(finalWaterIntake, finalWaterGoal);
        const activeGoalStatus = calculateGoalStatus(finalActiveMinutes, finalActiveGoal);
        const sleepGoalStatus = calculateGoalStatus(sleepHours !== null && sleepHours !== void 0 ? sleepHours : 0, finalSleepGoal);
        // ----------------------------------------------------------
        // CREATE
        // ----------------------------------------------------------
        const dailyLog = yield prisma_1.prisma.dailyHealthLog.create({
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
                distanceKm: distanceKm !== null && distanceKm !== void 0 ? distanceKm : 0,
                activeMinutes: finalActiveMinutes,
                caloriesBurned: caloriesBurned !== null && caloriesBurned !== void 0 ? caloriesBurned : 0,
                floorsClimbed: floorsClimbed !== null && floorsClimbed !== void 0 ? floorsClimbed : 0,
                // Body
                weightKg,
                bodyFatPercent,
                muscleMassKg,
                waterPercent,
                bmi,
                // Nutrition
                caloriesIntake: caloriesIntake !== null && caloriesIntake !== void 0 ? caloriesIntake : 0,
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
                relaxationMinutes: relaxationMinutes !== null && relaxationMinutes !== void 0 ? relaxationMinutes : 0,
                meditationMinutes: meditationMinutes !== null && meditationMinutes !== void 0 ? meditationMinutes : 0,
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
                calorieGoalStatus: caloriesGoal && caloriesGoal > 0
                    ? calculateGoalStatus(caloriesIntake !== null && caloriesIntake !== void 0 ? caloriesIntake : 0, caloriesGoal)
                    : "NOT_STARTED",
                // Source
                source: source !== null && source !== void 0 ? source : "MANUAL",
                deviceName,
            },
        });
        return res.status(201).json({
            isSuccess: true, success: true,
            message: "Daily health log created successfully",
            data: dailyLog,
        });
    }
    catch (error) {
        console.error("createDailyHealthLog error:", error);
        return res.status(500).json({
            isSuccess: false, success: false,
            message: "Failed to create daily health log",
            error: process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
        });
    }
});
exports.createDailyHealthLog = createDailyHealthLog;
// ============================================================
// GET TODAY'S DAILY HEALTH LOG
// ============================================================
const getTodayDailyHealthLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({
                isSuccess: false, success: false,
                message: "Unauthorized",
            });
        }
        const today = getDateOnly();
        const dailyLog = yield prisma_1.prisma.dailyHealthLog.findUnique({
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
    }
    catch (error) {
        console.error("getTodayDailyHealthLog error:", error);
        return res.status(500).json({
            isSuccess: false, success: false,
            message: "Failed to get today's health log",
        });
    }
});
exports.getTodayDailyHealthLog = getTodayDailyHealthLog;
// ============================================================
// GET DAILY HEALTH LOG BY DATE
// ============================================================
const getDailyHealthLogByDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const dailyLog = yield prisma_1.prisma.dailyHealthLog.findUnique({
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
    }
    catch (error) {
        console.error("getDailyHealthLogByDate error:", error);
        return res.status(500).json({
            isSuccess: false, success: false,
            message: "Failed to get daily health log",
        });
    }
});
exports.getDailyHealthLogByDate = getDailyHealthLogByDate;
// ============================================================
// GET DAILY HEALTH HISTORY
// ============================================================
const getDailyHealthHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({
                isSuccess: false, success: false,
                message: "Unauthorized",
            });
        }
        const limit = Math.min(Number(req.query.limit) || 30, 365);
        const logs = yield prisma_1.prisma.dailyHealthLog.findMany({
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
    }
    catch (error) {
        console.error("getDailyHealthHistory error:", error);
        return res.status(500).json({
            isSuccess: false, success: false,
            message: "Failed to get health history",
        });
    }
});
exports.getDailyHealthHistory = getDailyHealthHistory;
// ============================================================
// UPDATE DAILY HEALTH LOG
// ============================================================
const updateDailyHealthLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const existing = yield prisma_1.prisma.dailyHealthLog.findUnique({
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
        const { mood, sleepQuality, stressLevel, energyLevel, activityLevel, painLevel, painAreas, notes, steps, distanceKm, activeMinutes, caloriesBurned, floorsClimbed, weightKg, bodyFatPercent, muscleMassKg, waterPercent, bmi, caloriesIntake, proteinG, carbsG, fatG, fiberG, sugarG, waterIntakeMl, waterGoalMl, sleepHours, sleepStart, sleepEnd, relaxationMinutes, meditationMinutes, stepsGoal, waterGoalMlTarget, activeMinutesGoal, sleepGoalHours, caloriesGoal, source, deviceName, } = req.body;
        const finalSteps = steps !== null && steps !== void 0 ? steps : existing.steps;
        const finalWaterIntake = waterIntakeMl !== null && waterIntakeMl !== void 0 ? waterIntakeMl : existing.waterIntakeMl;
        const finalWaterGoal = (_a = waterGoalMl !== null && waterGoalMl !== void 0 ? waterGoalMl : waterGoalMlTarget) !== null && _a !== void 0 ? _a : existing.waterGoalMl;
        const finalActiveMinutes = activeMinutes !== null && activeMinutes !== void 0 ? activeMinutes : existing.activeMinutes;
        const finalActiveGoal = activeMinutesGoal !== null && activeMinutesGoal !== void 0 ? activeMinutesGoal : existing.activeMinutesGoal;
        const finalStepsGoal = stepsGoal !== null && stepsGoal !== void 0 ? stepsGoal : existing.stepsGoal;
        const finalSleepHours = sleepHours !== null && sleepHours !== void 0 ? sleepHours : existing.sleepHours;
        const finalSleepGoal = sleepGoalHours !== null && sleepGoalHours !== void 0 ? sleepGoalHours : existing.sleepGoalHours;
        const finalCaloriesIntake = caloriesIntake !== null && caloriesIntake !== void 0 ? caloriesIntake : existing.caloriesIntake;
        const finalCaloriesGoal = caloriesGoal !== null && caloriesGoal !== void 0 ? caloriesGoal : existing.caloriesGoal;
        const updatedLog = yield prisma_1.prisma.dailyHealthLog.update({
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
                hydrationStatus: calculateHydrationStatus(finalWaterIntake, finalWaterGoal),
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
                stepsGoalStatus: calculateGoalStatus(finalSteps, finalStepsGoal),
                waterGoalMlTarget: waterGoalMlTarget !== null && waterGoalMlTarget !== void 0 ? waterGoalMlTarget : existing.waterGoalMlTarget,
                waterGoalStatus: calculateGoalStatus(finalWaterIntake, finalWaterGoal),
                activeMinutesGoal,
                activeGoalStatus: calculateGoalStatus(finalActiveMinutes, finalActiveGoal),
                sleepGoalHours,
                sleepGoalStatus: calculateGoalStatus(finalSleepHours !== null && finalSleepHours !== void 0 ? finalSleepHours : 0, finalSleepGoal),
                caloriesGoal,
                calorieGoalStatus: finalCaloriesGoal
                    ? calculateGoalStatus(finalCaloriesIntake, finalCaloriesGoal)
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
    }
    catch (error) {
        console.error("updateDailyHealthLog error:", error);
        return res.status(500).json({
            isSuccess: false, success: false,
            message: "Failed to update daily health log",
            error: process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
        });
    }
});
exports.updateDailyHealthLog = updateDailyHealthLog;
// ============================================================
// DELETE DAILY HEALTH LOG
// ============================================================
const deleteDailyHealthLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existing = yield prisma_1.prisma.dailyHealthLog.findUnique({
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
        yield prisma_1.prisma.dailyHealthLog.delete({
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
    }
    catch (error) {
        console.error("deleteDailyHealthLog error:", error);
        return res.status(500).json({
            isSuccess: false, success: false,
            message: "Failed to delete daily health log",
        });
    }
});
exports.deleteDailyHealthLog = deleteDailyHealthLog;
