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
    var _a, _b, _c, _d;
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
        // Resolve professional account when doctorId is a ProfessionalProfile id or user id
        let professionalUserId = typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.professionalUserId) === "string"
            ? req.body.professionalUserId
            : null;
        if (!professionalUserId && doctorId) {
            const byProfile = yield prisma_1.prisma.professionalProfile.findFirst({
                where: {
                    OR: [
                        { professionalprofileid: String(doctorId) },
                        { slug: String(doctorId) },
                        { userId: String(doctorId) },
                    ],
                },
                select: { userId: true, professionalprofileid: true },
            });
            if (byProfile) {
                professionalUserId = byProfile.userId;
            }
        }
        const appointment = yield prisma_1.prisma.appointment.create({
            data: {
                userId,
                professionalUserId,
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
        const patient = yield prisma_1.prisma.user.findUnique({
            where: { userid: userId },
            select: {
                fullName: true,
                phone: true,
                email: true,
                profile: { select: { healthId: true } },
            },
        });
        if (professionalUserId) {
            yield prisma_1.prisma.notification
                .create({
                data: {
                    userId: professionalUserId,
                    title: "New appointment booking",
                    body: `${(patient === null || patient === void 0 ? void 0 : patient.fullName) || "A patient"} booked you for ${when.toLocaleString()}${reason ? ` · ${String(reason)}` : ""}.`,
                    type: client_1.NotificationType.APPOINTMENT,
                    channel: client_1.NotificationChannel.IN_APP,
                    metadata: {
                        appointmentId: appointment.appointmentid,
                        patientUserId: userId,
                        patientName: patient === null || patient === void 0 ? void 0 : patient.fullName,
                        patientHealthId: (_c = patient === null || patient === void 0 ? void 0 : patient.profile) === null || _c === void 0 ? void 0 : _c.healthId,
                    },
                },
            })
                .catch(() => undefined);
        }
        res.status(201).json({
            isSuccess: true,
            message: "Appointment booked",
            result: Object.assign(Object.assign({}, appointment), { patientName: patient === null || patient === void 0 ? void 0 : patient.fullName, patientHealthId: (_d = patient === null || patient === void 0 ? void 0 : patient.profile) === null || _d === void 0 ? void 0 : _d.healthId, patientPhone: patient === null || patient === void 0 ? void 0 : patient.phone, patientEmail: patient === null || patient === void 0 ? void 0 : patient.email }),
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
        const scope = typeof req.query.scope === "string" ? req.query.scope : "all";
        const statusFilter = status && Object.values(client_1.AppointmentStatus).includes(status)
            ? status
            : undefined;
        // Patient bookings + appointments where this user is the professional
        const appointments = yield prisma_1.prisma.appointment.findMany({
            where: Object.assign({ OR: [{ userId }, { professionalUserId: userId }] }, (statusFilter ? { status: statusFilter } : {})),
            orderBy: { scheduledAt: "desc" },
            take: 100,
            include: {
                user: {
                    select: {
                        userid: true,
                        fullName: true,
                        phone: true,
                        email: true,
                        avatarUrl: true,
                        picture: true,
                        profile: { select: { healthId: true, city: true } },
                    },
                },
                professional: {
                    select: {
                        userid: true,
                        fullName: true,
                        avatarUrl: true,
                        picture: true,
                    },
                },
            },
        });
        const mapped = appointments.map((a) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return (Object.assign(Object.assign({}, a), { patientName: (_a = a.user) === null || _a === void 0 ? void 0 : _a.fullName, patientUserId: a.userId, patientHealthId: (_d = (_c = (_b = a.user) === null || _b === void 0 ? void 0 : _b.profile) === null || _c === void 0 ? void 0 : _c.healthId) !== null && _d !== void 0 ? _d : null, patientPhone: (_f = (_e = a.user) === null || _e === void 0 ? void 0 : _e.phone) !== null && _f !== void 0 ? _f : null, patientEmail: (_h = (_g = a.user) === null || _g === void 0 ? void 0 : _g.email) !== null && _h !== void 0 ? _h : null, professionalName: ((_j = a.professional) === null || _j === void 0 ? void 0 : _j.fullName) || a.doctorName, isMineAsPatient: a.userId === userId, isMineAsProfessional: a.professionalUserId === userId }));
        });
        const now = Date.now();
        const closed = new Set([
            client_1.AppointmentStatus.CANCELLED,
            client_1.AppointmentStatus.COMPLETED,
            client_1.AppointmentStatus.NO_SHOW,
        ]);
        const upcoming = mapped.filter((a) => new Date(a.scheduledAt).getTime() >= now && !closed.has(a.status));
        const history = mapped.filter((a) => new Date(a.scheduledAt).getTime() < now || closed.has(a.status));
        const filtered = scope === "upcoming"
            ? upcoming
            : scope === "past" || scope === "history"
                ? history
                : mapped;
        res.status(200).json({
            isSuccess: true,
            result: filtered,
            meta: {
                upcomingCount: upcoming.length,
                historyCount: history.length,
                upcoming,
                history,
            },
        });
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
