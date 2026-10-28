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
exports.listPublicAvailability = exports.deleteAvailability = exports.updateAvailability = exports.createAvailability = exports.listMyAvailability = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const CLINICAL = [
    client_1.Role.DOCTOR,
    client_1.Role.NURSE,
    client_1.Role.MIDWIFE,
    client_1.Role.LAB_TECH,
    client_1.Role.PHARMACIST,
];
function actor(req) {
    const user = req.user;
    return {
        userId: ((user === null || user === void 0 ? void 0 : user.userId) || (user === null || user === void 0 ? void 0 : user.userid) || (user === null || user === void 0 ? void 0 : user.id) || null),
        role: ((user === null || user === void 0 ? void 0 : user.role) || null),
    };
}
function parseSlot(body) {
    const dayOfWeek = Number(body === null || body === void 0 ? void 0 : body.dayOfWeek);
    const startTime = String((body === null || body === void 0 ? void 0 : body.startTime) || "").trim();
    const endTime = String((body === null || body === void 0 ? void 0 : body.endTime) || "").trim();
    const isAvailable = (body === null || body === void 0 ? void 0 : body.isAvailable) !== false;
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return { error: "dayOfWeek must be 0–6 (Sunday–Saturday)" };
    }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
        return { error: "startTime and endTime must be HH:MM" };
    }
    if (startTime >= endTime) {
        return { error: "endTime must be after startTime" };
    }
    return { dayOfWeek, startTime, endTime, isAvailable };
}
/** GET /professional/availability — own slots */
const listMyAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        if (!role || !CLINICAL.includes(role)) {
            res.status(403).json({
                isSuccess: false,
                message: "Only professionals manage availability",
            });
            return;
        }
        const rows = yield prisma_1.prisma.professionalAvailability.findMany({
            where: { professionalUserId: userId },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        });
        res.status(200).json({ isSuccess: true, result: rows });
    }
    catch (error) {
        console.error("listMyAvailability error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to load availability",
        });
    }
});
exports.listMyAvailability = listMyAvailability;
/** POST /professional/availability */
const createAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, role } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        if (!role || !CLINICAL.includes(role)) {
            res.status(403).json({
                isSuccess: false,
                message: "Only professionals manage availability",
            });
            return;
        }
        const parsed = parseSlot(req.body);
        if ("error" in parsed && parsed.error) {
            res.status(400).json({ isSuccess: false, message: parsed.error });
            return;
        }
        const { dayOfWeek, startTime, endTime, isAvailable } = parsed;
        const row = yield prisma_1.prisma.professionalAvailability.create({
            data: {
                professionalUserId: userId,
                dayOfWeek,
                startTime,
                endTime,
                isAvailable,
            },
        });
        res.status(201).json({ isSuccess: true, result: row });
    }
    catch (error) {
        console.error("createAvailability error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to create availability",
        });
    }
});
exports.createAvailability = createAvailability;
/** PATCH /professional/availability/:id */
const updateAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id || "");
        const existing = yield prisma_1.prisma.professionalAvailability.findUnique({
            where: { id },
        });
        if (!existing || existing.professionalUserId !== userId) {
            res.status(404).json({ isSuccess: false, message: "Slot not found" });
            return;
        }
        const data = {};
        if (((_a = req.body) === null || _a === void 0 ? void 0 : _a.dayOfWeek) !== undefined) {
            const d = Number(req.body.dayOfWeek);
            if (!Number.isInteger(d) || d < 0 || d > 6) {
                res.status(400).json({ isSuccess: false, message: "Invalid dayOfWeek" });
                return;
            }
            data.dayOfWeek = d;
        }
        if (((_b = req.body) === null || _b === void 0 ? void 0 : _b.startTime) !== undefined)
            data.startTime = String(req.body.startTime);
        if (((_c = req.body) === null || _c === void 0 ? void 0 : _c.endTime) !== undefined)
            data.endTime = String(req.body.endTime);
        if (((_d = req.body) === null || _d === void 0 ? void 0 : _d.isAvailable) !== undefined)
            data.isAvailable = Boolean(req.body.isAvailable);
        const row = yield prisma_1.prisma.professionalAvailability.update({
            where: { id },
            data,
        });
        res.status(200).json({ isSuccess: true, result: row });
    }
    catch (error) {
        console.error("updateAvailability error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to update availability",
        });
    }
});
exports.updateAvailability = updateAvailability;
/** DELETE /professional/availability/:id */
const deleteAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = actor(req);
        if (!userId) {
            res.status(401).json({ isSuccess: false, message: "Sign in required" });
            return;
        }
        const id = String(req.params.id || "");
        const existing = yield prisma_1.prisma.professionalAvailability.findUnique({
            where: { id },
        });
        if (!existing || existing.professionalUserId !== userId) {
            res.status(404).json({ isSuccess: false, message: "Slot not found" });
            return;
        }
        yield prisma_1.prisma.professionalAvailability.delete({ where: { id } });
        res.status(200).json({ isSuccess: true, message: "Deleted" });
    }
    catch (error) {
        console.error("deleteAvailability error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to delete availability",
        });
    }
});
exports.deleteAvailability = deleteAvailability;
/** GET /professionals/:id/availability — public booking slots */
const listPublicAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const idOrSlug = String(req.params.id || "").trim();
        const profile = yield prisma_1.prisma.professionalProfile.findFirst({
            where: {
                isActive: true,
                deletedAt: null,
                isPubliclyVisible: true,
                OR: [{ professionalprofileid: idOrSlug }, { slug: idOrSlug }],
            },
            select: { userId: true },
        });
        if (!profile) {
            res.status(404).json({ isSuccess: false, message: "Professional not found" });
            return;
        }
        const rows = yield prisma_1.prisma.professionalAvailability.findMany({
            where: { professionalUserId: profile.userId, isAvailable: true },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        });
        res.status(200).json({ isSuccess: true, result: rows });
    }
    catch (error) {
        console.error("listPublicAvailability error:", error);
        res.status(500).json({
            isSuccess: false,
            message: "Failed to load availability",
        });
    }
});
exports.listPublicAvailability = listPublicAvailability;
