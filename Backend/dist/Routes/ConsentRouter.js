"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.consent, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g;
        return ({
            requesterId: (_a = (0, validation_1.optionalString)(body.requesterId)) !== null && _a !== void 0 ? _a : null,
            doctorId: (_b = (0, validation_1.optionalString)(body.doctorId)) !== null && _b !== void 0 ? _b : null,
            hospitalId: (_c = (0, validation_1.optionalString)(body.hospitalId)) !== null && _c !== void 0 ? _c : null,
            accessLevel: (0, validation_1.parseEnum)(body.accessLevel, Object.values(client_1.AccessLevel), "accessLevel", true),
            status: (_d = (0, validation_1.parseEnum)(body.status, Object.values(client_1.ConsentStatus), "status")) !== null && _d !== void 0 ? _d : client_1.ConsentStatus.PENDING,
            expiresAt: (_e = (0, validation_1.parseDate)(body.expiresAt, "expiresAt")) !== null && _e !== void 0 ? _e : null,
            medicalRecords: (0, validation_1.parseBool)(body.medicalRecords, false),
            vitalSigns: (0, validation_1.parseBool)(body.vitalSigns, false),
            medications: (0, validation_1.parseBool)(body.medications, false),
            allergies: (0, validation_1.parseBool)(body.allergies, false),
            chronicConditions: (0, validation_1.parseBool)(body.chronicConditions, false),
            labResults: (0, validation_1.parseBool)(body.labResults, false),
            prescriptions: (0, validation_1.parseBool)(body.prescriptions, false),
            appointments: (0, validation_1.parseBool)(body.appointments, false),
            purpose: (_f = (0, validation_1.optionalString)(body.purpose)) !== null && _f !== void 0 ? _f : null,
            notes: (_g = (0, validation_1.optionalString)(body.notes)) !== null && _g !== void 0 ? _g : null,
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d, _e;
        const data = {};
        if (body.accessLevel !== undefined) {
            data.accessLevel = (0, validation_1.parseEnum)(body.accessLevel, Object.values(client_1.AccessLevel), "accessLevel", true);
        }
        if (body.status !== undefined) {
            data.status = (0, validation_1.parseEnum)(body.status, Object.values(client_1.ConsentStatus), "status", true);
            if (body.status === client_1.ConsentStatus.APPROVED)
                data.grantedAt = new Date();
            if (body.status === client_1.ConsentStatus.REVOKED)
                data.revokedAt = new Date();
        }
        if (body.expiresAt !== undefined) {
            data.expiresAt = (_a = (0, validation_1.parseDate)(body.expiresAt, "expiresAt")) !== null && _a !== void 0 ? _a : null;
        }
        for (const key of [
            "medicalRecords",
            "vitalSigns",
            "medications",
            "allergies",
            "chronicConditions",
            "labResults",
            "prescriptions",
            "appointments",
        ]) {
            if (body[key] !== undefined)
                data[key] = (0, validation_1.parseBool)(body[key]);
        }
        if (body.purpose !== undefined)
            data.purpose = (_b = (0, validation_1.optionalString)(body.purpose)) !== null && _b !== void 0 ? _b : null;
        if (body.notes !== undefined)
            data.notes = (_c = (0, validation_1.optionalString)(body.notes)) !== null && _c !== void 0 ? _c : null;
        if (body.doctorId !== undefined)
            data.doctorId = (_d = (0, validation_1.optionalString)(body.doctorId)) !== null && _d !== void 0 ? _d : null;
        if (body.hospitalId !== undefined)
            data.hospitalId = (_e = (0, validation_1.optionalString)(body.hospitalId)) !== null && _e !== void 0 ? _e : null;
        return data;
    },
});
