"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.diagnosis, {
    include: { doctor: true },
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return ({
            doctorId: (_a = (0, validation_1.optionalString)(body.doctorId)) !== null && _a !== void 0 ? _a : null,
            appointmentId: (_b = (0, validation_1.optionalString)(body.appointmentId)) !== null && _b !== void 0 ? _b : null,
            consultationId: (_c = (0, validation_1.optionalString)(body.consultationId)) !== null && _c !== void 0 ? _c : null,
            diagnosis: (0, validation_1.requireString)(body.diagnosis, "diagnosis"),
            icdCode: (_d = (0, validation_1.optionalString)(body.icdCode)) !== null && _d !== void 0 ? _d : null,
            description: (_e = (0, validation_1.optionalString)(body.description)) !== null && _e !== void 0 ? _e : null,
            diagnosedAt: (_f = (0, validation_1.parseDate)(body.diagnosedAt, "diagnosedAt")) !== null && _f !== void 0 ? _f : new Date(),
            isPrimary: (0, validation_1.parseBool)(body.isPrimary, false),
            status: (_g = (0, validation_1.optionalString)(body.status)) !== null && _g !== void 0 ? _g : null,
            notes: (_h = (0, validation_1.optionalString)(body.notes)) !== null && _h !== void 0 ? _h : null,
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const data = {};
        if (body.diagnosis !== undefined)
            data.diagnosis = (0, validation_1.requireString)(body.diagnosis, "diagnosis");
        if (body.icdCode !== undefined)
            data.icdCode = (_a = (0, validation_1.optionalString)(body.icdCode)) !== null && _a !== void 0 ? _a : null;
        if (body.description !== undefined)
            data.description = (_b = (0, validation_1.optionalString)(body.description)) !== null && _b !== void 0 ? _b : null;
        if (body.diagnosedAt !== undefined)
            data.diagnosedAt = (_c = (0, validation_1.parseDate)(body.diagnosedAt, "diagnosedAt")) !== null && _c !== void 0 ? _c : undefined;
        if (body.isPrimary !== undefined)
            data.isPrimary = (0, validation_1.parseBool)(body.isPrimary);
        if (body.status !== undefined)
            data.status = (_d = (0, validation_1.optionalString)(body.status)) !== null && _d !== void 0 ? _d : null;
        if (body.notes !== undefined)
            data.notes = (_e = (0, validation_1.optionalString)(body.notes)) !== null && _e !== void 0 ? _e : null;
        if (body.doctorId !== undefined)
            data.doctorId = (_f = (0, validation_1.optionalString)(body.doctorId)) !== null && _f !== void 0 ? _f : null;
        if (body.appointmentId !== undefined)
            data.appointmentId = (_g = (0, validation_1.optionalString)(body.appointmentId)) !== null && _g !== void 0 ? _g : null;
        if (body.consultationId !== undefined)
            data.consultationId = (_h = (0, validation_1.optionalString)(body.consultationId)) !== null && _h !== void 0 ? _h : null;
        return data;
    },
});
