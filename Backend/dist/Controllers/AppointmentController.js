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
exports.cancelAppointment = exports.listMyAppointments = exports.createAppointment = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
function getUserId(req) {
    const user = req.user;
    return (user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null;
}
function makeAppointmentCode() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `APT-${stamp}-${rand}`;
}
function parseScheduledAt(value) {
    if (typeof value !== "string" && !(value instanceof Date))
        return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
/** POST /appointments — any signed-in user can book */
const createAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const { doctorId, doctorName, specialty, facilityName, facilityId, scheduledAt, duration, reason, notes, visitType, } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const when = parseScheduledAt(scheduledAt);
        if (!when) {
            res.status(400).json({
                isSuccess: false,
                message: "scheduledAt is required (ISO date)",
            });
            return;
        }
        if (when.getTime() < Date.now() - 60000) {
            res.status(400).json({
                isSuccess: false,
                message: "Choose a future date and time",
            });
            return;
        }
        const isVideo = String(visitType || "").toLowerCase().includes("video") ||
            String(visitType || "").toLowerCase() === "telehealth";
        const appointment = yield prisma_1.prisma.appointment.create({
            data: {
                userId,
                appointmentCode: makeAppointmentCode(),
                doctorId: doctorId ? String(doctorId) : null,
                doctorName: doctorName ? String(doctorName) : "Clinician",
                specialty: specialty ? String(specialty) : null,
                facilityName: facilityName ? String(facilityName) : null,
                facilityId: facilityId ? String(facilityId) : null,
                scheduledAt: when,
                duration: Number(duration) > 0 ? Number(duration) : 30,
                reason: reason ? String(reason) : null,
                notes: notes
                    ? String(notes)
                    : visitType
                        ? `Visit type: ${visitType}`
                        : null,
                meetingLink: isVideo
                    ? `https://daryeel-healthtech.vercel.app/dashboard?section=appointments`
                    : null,
                status: client_1.AppointmentStatus.SCHEDULED,
            },
        });
        res.status(201).json({
            isSuccess: true,
            message: "Appointment booked",
            result: appointment,
        });
    }
    catch (error) {
        console.error("createAppointment error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to book appointment",
        });
    }
});
exports.createAppointment = createAppointment;
/** GET /appointments — list current user's bookings */
const listMyAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const status = typeof req.query.status === "string" ? req.query.status : "";
        const where = { userId };
        if (status && Object.values(client_1.AppointmentStatus).includes(status)) {
            where.status = status;
        }
        const appointments = yield prisma_1.prisma.appointment.findMany({
            where,
            orderBy: { scheduledAt: "asc" },
            take: 100,
        });
        res.status(200).json({ isSuccess: true, result: appointments });
    }
    catch (error) {
        console.error("listMyAppointments error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to load appointments",
        });
    }
});
exports.listMyAppointments = listMyAppointments;
/** PATCH /appointments/:id/cancel */
const cancelAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id || "");
        const existing = yield prisma_1.prisma.appointment.findFirst({
            where: { appointmentid: id, userId },
        });
        if (!existing) {
            res.status(404).json({ isSuccess: false, message: "Appointment not found" });
            return;
        }
        if (existing.status === client_1.AppointmentStatus.CANCELLED) {
            res.status(200).json({ isSuccess: true, result: existing });
            return;
        }
        const appointment = yield prisma_1.prisma.appointment.update({
            where: { appointmentid: id },
            data: {
                status: client_1.AppointmentStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelledReason: typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) === "string"
                    ? req.body.reason
                    : "Cancelled by patient",
            },
        });
        res.status(200).json({
            isSuccess: true,
            message: "Appointment cancelled",
            result: appointment,
        });
    }
    catch (error) {
        console.error("cancelAppointment error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to cancel appointment",
        });
    }
});
exports.cancelAppointment = cancelAppointment;
