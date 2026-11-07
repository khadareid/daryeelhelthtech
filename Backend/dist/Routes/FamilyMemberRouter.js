"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.familyMember, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e;
        return ({
            fullName: (0, validation_1.requireString)(body.fullName, "fullName"),
            relationship: (0, validation_1.requireString)(body.relationship, "relationship"),
            linkedUserId: (_a = (0, validation_1.optionalString)(body.linkedUserId)) !== null && _a !== void 0 ? _a : null,
            dateOfBirth: (_b = (0, validation_1.parseDate)(body.dateOfBirth, "dateOfBirth")) !== null && _b !== void 0 ? _b : null,
            gender: (_c = (0, validation_1.parseEnum)(body.gender, Object.values(client_1.Gender), "gender")) !== null && _c !== void 0 ? _c : null,
            phone: (_d = (0, validation_1.optionalString)(body.phone)) !== null && _d !== void 0 ? _d : null,
            isDependent: (0, validation_1.parseBool)(body.isDependent, false),
            canManageHealthRecords: (0, validation_1.parseBool)(body.canManageHealthRecords, false),
            canBookAppointments: (0, validation_1.parseBool)(body.canBookAppointments, false),
            canViewMedicalRecords: (0, validation_1.parseBool)(body.canViewMedicalRecords, false),
            isEmergencyContact: (0, validation_1.parseBool)(body.isEmergencyContact, false),
            notes: (_e = (0, validation_1.optionalString)(body.notes)) !== null && _e !== void 0 ? _e : null,
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d, _e;
        const data = {};
        if (body.fullName !== undefined)
            data.fullName = (0, validation_1.requireString)(body.fullName, "fullName");
        if (body.relationship !== undefined)
            data.relationship = (0, validation_1.requireString)(body.relationship, "relationship");
        if (body.linkedUserId !== undefined)
            data.linkedUserId = (_a = (0, validation_1.optionalString)(body.linkedUserId)) !== null && _a !== void 0 ? _a : null;
        if (body.dateOfBirth !== undefined)
            data.dateOfBirth = (_b = (0, validation_1.parseDate)(body.dateOfBirth, "dateOfBirth")) !== null && _b !== void 0 ? _b : null;
        if (body.gender !== undefined)
            data.gender = (_c = (0, validation_1.parseEnum)(body.gender, Object.values(client_1.Gender), "gender")) !== null && _c !== void 0 ? _c : null;
        if (body.phone !== undefined)
            data.phone = (_d = (0, validation_1.optionalString)(body.phone)) !== null && _d !== void 0 ? _d : null;
        if (body.isDependent !== undefined)
            data.isDependent = (0, validation_1.parseBool)(body.isDependent);
        if (body.canManageHealthRecords !== undefined)
            data.canManageHealthRecords = (0, validation_1.parseBool)(body.canManageHealthRecords);
        if (body.canBookAppointments !== undefined)
            data.canBookAppointments = (0, validation_1.parseBool)(body.canBookAppointments);
        if (body.canViewMedicalRecords !== undefined)
            data.canViewMedicalRecords = (0, validation_1.parseBool)(body.canViewMedicalRecords);
        if (body.isEmergencyContact !== undefined)
            data.isEmergencyContact = (0, validation_1.parseBool)(body.isEmergencyContact);
        if (body.notes !== undefined)
            data.notes = (_e = (0, validation_1.optionalString)(body.notes)) !== null && _e !== void 0 ? _e : null;
        return data;
    },
});
