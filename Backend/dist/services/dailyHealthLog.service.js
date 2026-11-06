"use strict";
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
exports.deleteDailyHealthLog = exports.upsertDailyHealthLog = exports.getDailyHealthLog = exports.listDailyHealthLogs = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const ownership_1 = require("../utils/ownership");
const pagination_1 = require("../utils/pagination");
const validation_1 = require("../utils/validation");
const getDateOnly = (value) => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime()))
        throw new ownership_1.HttpError(400, "Invalid date");
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};
const calcHydration = (intake, goal) => {
    if (!goal || goal <= 0)
        return client_1.HydrationStatus.NOT_MET;
    const pct = (intake / goal) * 100;
    if (pct > 100)
        return client_1.HydrationStatus.EXCEEDED;
    if (pct >= 80)
        return client_1.HydrationStatus.MET;
    if (pct > 0)
        return client_1.HydrationStatus.PARTIAL;
    return client_1.HydrationStatus.NOT_MET;
};
const calcGoal = (current, goal) => {
    if (!goal || goal <= 0 || current <= 0)
        return client_1.GoalStatus.NOT_STARTED;
    if (current >= goal)
        return client_1.GoalStatus.COMPLETED;
    return client_1.GoalStatus.IN_PROGRESS;
};
const listDailyHealthLogs = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { userId };
    if (query.from || query.to) {
        where.date = {};
        if (query.from)
            where.date.gte = getDateOnly(String(query.from));
        if (query.to)
            where.date.lte = getDateOnly(String(query.to));
    }
    const [items, total] = yield Promise.all([
        prisma_1.prisma.dailyHealthLog.findMany({
            where,
            orderBy: { date: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.dailyHealthLog.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.pageMeta)(total, page, limit) };
});
exports.listDailyHealthLogs = listDailyHealthLogs;
const getDailyHealthLog = (userId, id) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.prisma.dailyHealthLog.findFirst({ where: { id, userId } });
    if (!row)
        throw new ownership_1.HttpError(404, "Daily health log not found");
    return row;
});
exports.getDailyHealthLog = getDailyHealthLog;
const upsertDailyHealthLog = (userId, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const date = getDateOnly(typeof body.date === "string" || body.date instanceof Date
        ? body.date
        : undefined);
    const steps = (_a = (0, validation_1.parseNumber)(body.steps, "steps")) !== null && _a !== void 0 ? _a : 0;
    const stepsGoal = (_b = (0, validation_1.parseNumber)(body.stepsGoal, "stepsGoal")) !== null && _b !== void 0 ? _b : 10000;
    const waterIntakeMl = (_c = (0, validation_1.parseNumber)(body.waterIntakeMl, "waterIntakeMl")) !== null && _c !== void 0 ? _c : 0;
    const waterGoalMl = (_d = (0, validation_1.parseNumber)(body.waterGoalMl, "waterGoalMl")) !== null && _d !== void 0 ? _d : 2000;
    const activeMinutes = (_e = (0, validation_1.parseNumber)(body.activeMinutes, "activeMinutes")) !== null && _e !== void 0 ? _e : 0;
    const activeMinutesGoal = (_f = (0, validation_1.parseNumber)(body.activeMinutesGoal, "activeMinutesGoal")) !== null && _f !== void 0 ? _f : 30;
    const sleepHours = (_g = (0, validation_1.parseNumber)(body.sleepHours, "sleepHours")) !== null && _g !== void 0 ? _g : null;
    const sleepGoalHours = (_h = (0, validation_1.parseNumber)(body.sleepGoalHours, "sleepGoalHours")) !== null && _h !== void 0 ? _h : 8;
    const data = {
        userId,
        date,
        mood: (_j = (0, validation_1.parseEnum)(body.mood, Object.values(client_1.MoodLevel), "mood")) !== null && _j !== void 0 ? _j : null,
        sleepQuality: (_k = (0, validation_1.parseEnum)(body.sleepQuality, Object.values(client_1.SleepQuality), "sleepQuality")) !== null && _k !== void 0 ? _k : null,
        stressLevel: (_l = (0, validation_1.parseEnum)(body.stressLevel, Object.values(client_1.StressLevel), "stressLevel")) !== null && _l !== void 0 ? _l : null,
        energyLevel: (_m = (0, validation_1.parseEnum)(body.energyLevel, Object.values(client_1.EnergyLevel), "energyLevel")) !== null && _m !== void 0 ? _m : null,
        activityLevel: (_o = (0, validation_1.parseEnum)(body.activityLevel, Object.values(client_1.ActivityLevel), "activityLevel")) !== null && _o !== void 0 ? _o : null,
        painLevel: (_p = (0, validation_1.parseEnum)(body.painLevel, Object.values(client_1.PainLevel), "painLevel")) !== null && _p !== void 0 ? _p : null,
        notes: (_q = (0, validation_1.optionalString)(body.notes)) !== null && _q !== void 0 ? _q : null,
        steps,
        distanceKm: (_r = (0, validation_1.parseNumber)(body.distanceKm, "distanceKm")) !== null && _r !== void 0 ? _r : 0,
        activeMinutes,
        caloriesBurned: (_s = (0, validation_1.parseNumber)(body.caloriesBurned, "caloriesBurned")) !== null && _s !== void 0 ? _s : 0,
        heartRateAvg: (_t = (0, validation_1.parseNumber)(body.heartRateAvg, "heartRateAvg")) !== null && _t !== void 0 ? _t : null,
        heartRateMin: (_u = (0, validation_1.parseNumber)(body.heartRateMin, "heartRateMin")) !== null && _u !== void 0 ? _u : null,
        heartRateMax: (_v = (0, validation_1.parseNumber)(body.heartRateMax, "heartRateMax")) !== null && _v !== void 0 ? _v : null,
        weightKg: (_w = (0, validation_1.parseNumber)(body.weightKg, "weightKg")) !== null && _w !== void 0 ? _w : null,
        bodyFatPercent: (_x = (0, validation_1.parseNumber)(body.bodyFatPercent, "bodyFatPercent")) !== null && _x !== void 0 ? _x : null,
        bmi: (_y = (0, validation_1.parseNumber)(body.bmi, "bmi")) !== null && _y !== void 0 ? _y : null,
        oxygenSaturation: (_z = (0, validation_1.parseNumber)(body.oxygenSaturation, "oxygenSaturation")) !== null && _z !== void 0 ? _z : null,
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
        sleepGoalStatus: calcGoal(sleepHours !== null && sleepHours !== void 0 ? sleepHours : 0, sleepGoalHours),
        source: (0, validation_1.parseEnum)(body.source, Object.values(client_1.DailyLogSource), "source") ||
            client_1.DailyLogSource.MANUAL,
        deviceName: (_0 = (0, validation_1.optionalString)(body.deviceName)) !== null && _0 !== void 0 ? _0 : null,
    };
    return prisma_1.prisma.dailyHealthLog.upsert({
        where: { userId_date: { userId, date } },
        create: data,
        update: data,
    });
});
exports.upsertDailyHealthLog = upsertDailyHealthLog;
const deleteDailyHealthLog = (userId, id) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.getDailyHealthLog)(userId, id);
    return prisma_1.prisma.dailyHealthLog.delete({ where: { id } });
});
exports.deleteDailyHealthLog = deleteDailyHealthLog;
