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
exports.getActorDoctorId = exports.assertPatientOrDoctorOrAdmin = exports.assertOwnerOrAdmin = exports.resolveTargetUserId = exports.requireUser = exports.HttpError = void 0;
const rbac_1 = require("../helpers/middleware/rbac");
const prisma_1 = require("../lib/prisma");
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.HttpError = HttpError;
const requireUser = (req) => {
    const user = req.user;
    if (!user)
        throw new HttpError(401, "Unauthorized");
    return user;
};
exports.requireUser = requireUser;
const resolveTargetUserId = (req, bodyUserId) => {
    const user = (0, exports.requireUser)(req);
    if ((0, rbac_1.isAdminRole)(user.role) && bodyUserId)
        return bodyUserId;
    return user.userId;
};
exports.resolveTargetUserId = resolveTargetUserId;
const assertOwnerOrAdmin = (ownerUserId, actor, message = "Forbidden") => {
    if ((0, rbac_1.isAdminRole)(actor.role))
        return;
    if (!ownerUserId || ownerUserId !== actor.userId) {
        throw new HttpError(403, message);
    }
};
exports.assertOwnerOrAdmin = assertOwnerOrAdmin;
/** Patient owner OR admin OR the assigned doctor for appointment/consultation-linked data */
const assertPatientOrDoctorOrAdmin = (patientUserId, actor, opts) => __awaiter(void 0, void 0, void 0, function* () {
    if ((0, rbac_1.isAdminRole)(actor.role))
        return;
    if (patientUserId === actor.userId)
        return;
    const doctor = yield prisma_1.prisma.doctor.findUnique({
        where: { userId: actor.userId },
        select: { id: true },
    });
    if (!doctor)
        throw new HttpError(403, "Forbidden");
    if ((opts === null || opts === void 0 ? void 0 : opts.doctorId) && opts.doctorId === doctor.id)
        return;
    if (opts === null || opts === void 0 ? void 0 : opts.appointmentId) {
        const appt = yield prisma_1.prisma.appointment.findUnique({
            where: { id: opts.appointmentId },
            select: { doctorId: true, userId: true },
        });
        if ((appt === null || appt === void 0 ? void 0 : appt.doctorId) === doctor.id)
            return;
    }
    throw new HttpError(403, "Forbidden");
});
exports.assertPatientOrDoctorOrAdmin = assertPatientOrDoctorOrAdmin;
const getActorDoctorId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const doctor = yield prisma_1.prisma.doctor.findUnique({
        where: { userId },
        select: { id: true },
    });
    return (_a = doctor === null || doctor === void 0 ? void 0 : doctor.id) !== null && _a !== void 0 ? _a : null;
});
exports.getActorDoctorId = getActorDoctorId;
