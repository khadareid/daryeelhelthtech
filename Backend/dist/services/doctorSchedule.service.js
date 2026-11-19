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
exports.getDoctorDayAvailability = exports.deleteMyTimeOff = exports.createMyTimeOff = exports.listMyTimeOff = exports.copyMyScheduleDay = exports.deleteMySchedule = exports.updateMySchedule = exports.createMySchedule = exports.listMySchedules = void 0;
const prisma_1 = require("../lib/prisma");
const ownership_1 = require("../utils/ownership");
const validation_1 = require("../utils/validation");
const CLINIC_OFFSET_MS = 3 * 60 * 60000;
function parseMinutes(raw) {
    const [h, m] = String(raw || "0:0").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}
function minutesToHHMM(total) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function dayOfWeekForDate(date) {
    const [y, mo, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)).getUTCDay();
}
function clinicDateTime(date, hhmm) {
    const t = hhmm.length === 5 ? `${hhmm}:00` : hhmm;
    return new Date(`${date}T${t}+03:00`);
}
function requireMyDoctor(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const doctor = yield prisma_1.prisma.doctor.findUnique({ where: { userId } });
        if (!doctor)
            throw new ownership_1.HttpError(404, "Doctor profile not found");
        return doctor;
    });
}
const listMySchedules = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield requireMyDoctor(userId);
    return prisma_1.prisma.doctorSchedule.findMany({
        where: { doctorId: doctor.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
});
exports.listMySchedules = listMySchedules;
const createMySchedule = (userId, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const doctor = yield requireMyDoctor(userId);
    const dayOfWeek = (0, validation_1.parseNumber)(body.dayOfWeek, "dayOfWeek");
    const startTime = (0, validation_1.requireString)(body.startTime, "startTime");
    const endTime = (0, validation_1.requireString)(body.endTime, "endTime");
    if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new ownership_1.HttpError(400, "dayOfWeek must be 0–6");
    }
    if (parseMinutes(startTime) >= parseMinutes(endTime)) {
        throw new ownership_1.HttpError(400, "startTime must be before endTime");
    }
    const slotMinutes = (0, validation_1.parseNumber)(body.slotMinutes, "slotMinutes") ||
        doctor.appointmentDurationMinutes ||
        30;
    return prisma_1.prisma.doctorSchedule.create({
        data: {
            doctorId: doctor.id,
            dayOfWeek,
            startTime,
            endTime,
            breakStart: (_a = (0, validation_1.optionalString)(body.breakStart)) !== null && _a !== void 0 ? _a : null,
            breakEnd: (_b = (0, validation_1.optionalString)(body.breakEnd)) !== null && _b !== void 0 ? _b : null,
            slotMinutes,
            label: (_c = (0, validation_1.optionalString)(body.label)) !== null && _c !== void 0 ? _c : null,
            isAvailable: (0, validation_1.parseBool)(body.isAvailable, true),
        },
    });
});
exports.createMySchedule = createMySchedule;
const updateMySchedule = (userId, scheduleId, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const doctor = yield requireMyDoctor(userId);
    const existing = yield prisma_1.prisma.doctorSchedule.findFirst({
        where: { id: scheduleId, doctorId: doctor.id },
    });
    if (!existing)
        throw new ownership_1.HttpError(404, "Schedule not found");
    const data = {};
    if (body.dayOfWeek != null)
        data.dayOfWeek = Number(body.dayOfWeek);
    if (body.startTime != null)
        data.startTime = String(body.startTime);
    if (body.endTime != null)
        data.endTime = String(body.endTime);
    if (body.breakStart !== undefined) {
        data.breakStart = (_a = (0, validation_1.optionalString)(body.breakStart)) !== null && _a !== void 0 ? _a : null;
    }
    if (body.breakEnd !== undefined) {
        data.breakEnd = (_b = (0, validation_1.optionalString)(body.breakEnd)) !== null && _b !== void 0 ? _b : null;
    }
    if (body.slotMinutes != null)
        data.slotMinutes = Number(body.slotMinutes) || 30;
    if (body.label !== undefined)
        data.label = (_c = (0, validation_1.optionalString)(body.label)) !== null && _c !== void 0 ? _c : null;
    if (body.isAvailable != null)
        data.isAvailable = Boolean(body.isAvailable);
    return prisma_1.prisma.doctorSchedule.update({ where: { id: scheduleId }, data });
});
exports.updateMySchedule = updateMySchedule;
const deleteMySchedule = (userId, scheduleId) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield requireMyDoctor(userId);
    const existing = yield prisma_1.prisma.doctorSchedule.findFirst({
        where: { id: scheduleId, doctorId: doctor.id },
    });
    if (!existing)
        throw new ownership_1.HttpError(404, "Schedule not found");
    yield prisma_1.prisma.doctorSchedule.delete({ where: { id: scheduleId } });
    return { deleted: true };
});
exports.deleteMySchedule = deleteMySchedule;
const copyMyScheduleDay = (userId, body) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield requireMyDoctor(userId);
    const fromDay = Number(body.fromDay);
    const toDays = Array.isArray(body.toDays) ? body.toDays.map(Number) : [];
    if (Number.isNaN(fromDay) || toDays.length === 0) {
        throw new ownership_1.HttpError(400, "fromDay and toDays[] are required");
    }
    const source = yield prisma_1.prisma.doctorSchedule.findMany({
        where: { doctorId: doctor.id, dayOfWeek: fromDay },
    });
    if (source.length === 0) {
        throw new ownership_1.HttpError(404, "No shifts on the source day");
    }
    const created = [];
    for (const day of toDays) {
        if (Number.isNaN(day) || day < 0 || day > 6 || day === fromDay)
            continue;
        yield prisma_1.prisma.doctorSchedule.deleteMany({
            where: { doctorId: doctor.id, dayOfWeek: day },
        });
        for (const s of source) {
            created.push(yield prisma_1.prisma.doctorSchedule.create({
                data: {
                    doctorId: doctor.id,
                    dayOfWeek: day,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    breakStart: s.breakStart,
                    breakEnd: s.breakEnd,
                    slotMinutes: s.slotMinutes,
                    label: s.label,
                    isAvailable: s.isAvailable,
                },
            }));
        }
    }
    return created;
});
exports.copyMyScheduleDay = copyMyScheduleDay;
const listMyTimeOff = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield requireMyDoctor(userId);
    return prisma_1.prisma.doctorTimeOff.findMany({
        where: { doctorId: doctor.id },
        orderBy: { date: "desc" },
    });
});
exports.listMyTimeOff = listMyTimeOff;
const createMyTimeOff = (userId, body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const doctor = yield requireMyDoctor(userId);
    const date = (0, validation_1.requireString)(body.date, "date");
    return prisma_1.prisma.doctorTimeOff.create({
        data: {
            doctorId: doctor.id,
            date: new Date(date),
            startTime: (_a = (0, validation_1.optionalString)(body.startTime)) !== null && _a !== void 0 ? _a : null,
            endTime: (_b = (0, validation_1.optionalString)(body.endTime)) !== null && _b !== void 0 ? _b : null,
            kind: (0, validation_1.optionalString)(body.kind) || "OFF_DUTY",
            reason: (_c = (0, validation_1.optionalString)(body.reason)) !== null && _c !== void 0 ? _c : null,
        },
    });
});
exports.createMyTimeOff = createMyTimeOff;
const deleteMyTimeOff = (userId, timeOffId) => __awaiter(void 0, void 0, void 0, function* () {
    const doctor = yield requireMyDoctor(userId);
    const existing = yield prisma_1.prisma.doctorTimeOff.findFirst({
        where: { id: timeOffId, doctorId: doctor.id },
    });
    if (!existing)
        throw new ownership_1.HttpError(404, "Time off not found");
    yield prisma_1.prisma.doctorTimeOff.delete({ where: { id: timeOffId } });
    return { deleted: true };
});
exports.deleteMyTimeOff = deleteMyTimeOff;
const getDoctorDayAvailability = (doctorId, date) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const doctor = yield prisma_1.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor || !doctor.isActive) {
        throw new ownership_1.HttpError(404, "Doctor not found");
    }
    if (!doctor.isAvailable) {
        return {
            doctorId,
            date,
            status: "UNAVAILABLE",
            reason: "Doctor marked unavailable",
            workingHours: [],
            slots: [],
            nextAvailable: null,
        };
    }
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const timeOffs = yield prisma_1.prisma.doctorTimeOff.findMany({
        where: { doctorId, date: dayStart, isActive: true },
    });
    const fullDay = timeOffs.find((t) => !t.startTime && !t.endTime);
    if (fullDay) {
        return {
            doctorId,
            date,
            status: fullDay.kind === "HOLIDAY" ? "HOLIDAY" : "OFF_DUTY",
            reason: fullDay.reason || "Not available today",
            workingHours: [],
            slots: [],
            nextAvailable: null,
        };
    }
    const dow = dayOfWeekForDate(date);
    let windows = yield prisma_1.prisma.doctorSchedule.findMany({
        where: { doctorId, dayOfWeek: dow, isAvailable: true },
        orderBy: { startTime: "asc" },
    });
    // If doctor never configured a schedule, fall back to default clinic hours
    const anySchedule = yield prisma_1.prisma.doctorSchedule.count({ where: { doctorId } });
    if (windows.length === 0 && anySchedule === 0) {
        windows = [
            {
                id: "default",
                doctorId,
                dayOfWeek: dow,
                startTime: "08:00",
                endTime: "17:00",
                breakStart: "12:00",
                breakEnd: "13:00",
                slotMinutes: doctor.appointmentDurationMinutes || 30,
                label: "Default",
                isAvailable: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
    }
    if (windows.length === 0) {
        return {
            doctorId,
            date,
            status: "NOT_SCHEDULED",
            reason: "No working schedule for this day",
            workingHours: [],
            slots: [],
            nextAvailable: null,
        };
    }
    const dayStartIso = clinicDateTime(date, "00:00");
    const dayEndIso = clinicDateTime(date, "23:59");
    const booked = yield prisma_1.prisma.appointment.findMany({
        where: {
            doctorId,
            status: {
                in: [
                    "PENDING",
                    "CONFIRMED",
                    "ACCEPTED",
                    "CHECKED_IN",
                    "IN_PROGRESS",
                    "RESCHEDULE_REQUESTED",
                ],
            },
            scheduledAt: { gte: dayStartIso, lte: dayEndIso },
        },
        select: { scheduledAt: true, duration: true },
    });
    const partialBlocks = timeOffs.filter((t) => t.startTime && t.endTime);
    const now = Date.now() + 5 * 60000;
    const slots = [];
    for (const w of windows) {
        const slotMin = w.slotMinutes || doctor.appointmentDurationMinutes || 30;
        const start = parseMinutes(w.startTime);
        const end = parseMinutes(w.endTime);
        const bs = w.breakStart ? parseMinutes(w.breakStart) : null;
        const be = w.breakEnd ? parseMinutes(w.breakEnd) : null;
        const segments = bs != null && be != null && be > bs && bs >= start && be <= end
            ? [
                ...(bs > start ? [{ start, end: bs }] : []),
                ...(end > be ? [{ start: be, end }] : []),
            ]
            : [{ start, end }];
        for (const seg of segments) {
            let cursor = seg.start;
            while (cursor + slotMin <= seg.end) {
                const hhmm = minutesToHHMM(cursor);
                const slotStart = clinicDateTime(date, hhmm);
                const slotEnd = new Date(slotStart.getTime() + slotMin * 60000);
                let available = slotStart.getTime() > now;
                let reason = available ? null : "PAST";
                if (available) {
                    const blocked = partialBlocks.some((b) => {
                        const bStart = clinicDateTime(date, String(b.startTime));
                        const bEnd = clinicDateTime(date, String(b.endTime));
                        return slotStart < bEnd && bStart < slotEnd;
                    });
                    if (blocked) {
                        available = false;
                        reason = "TEMPORARILY_UNAVAILABLE";
                    }
                }
                if (available) {
                    const conflict = booked.some((b) => {
                        const bEnd = new Date(b.scheduledAt.getTime() + (b.duration || 30) * 60000);
                        return b.scheduledAt < slotEnd && bEnd > slotStart;
                    });
                    if (conflict) {
                        available = false;
                        reason = "BOOKED";
                    }
                }
                slots.push({
                    time: hhmm,
                    iso: slotStart.toISOString(),
                    available,
                    reason,
                });
                cursor += slotMin;
            }
        }
    }
    const open = slots.filter((s) => s.available);
    let status = "AVAILABLE";
    if (open.length === 0) {
        status = slots.some((s) => s.reason === "BOOKED") ? "BUSY" : "UNAVAILABLE";
    }
    return {
        doctorId,
        date,
        timezone: "Africa/Mogadishu",
        status,
        reason: null,
        workingHours: windows.map((w) => ({
            start: w.startTime,
            end: w.endTime,
            breakStart: w.breakStart,
            breakEnd: w.breakEnd,
            label: w.label,
            slotMinutes: w.slotMinutes,
        })),
        slots,
        nextAvailable: ((_a = open[0]) === null || _a === void 0 ? void 0 : _a.iso) || null,
    };
});
exports.getDoctorDayAvailability = getDoctorDayAvailability;
