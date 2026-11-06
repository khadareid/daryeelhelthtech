"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.medicalRecord, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e, _f;
        return ({
            recordType: (0, validation_1.requireString)(body.recordType, "recordType"),
            title: (0, validation_1.requireString)(body.title, "title"),
            description: (_a = (0, validation_1.optionalString)(body.description)) !== null && _a !== void 0 ? _a : null,
            diagnosis: (_b = (0, validation_1.optionalString)(body.diagnosis)) !== null && _b !== void 0 ? _b : null,
            treatment: (_c = (0, validation_1.optionalString)(body.treatment)) !== null && _c !== void 0 ? _c : null,
            doctorName: (_d = (0, validation_1.optionalString)(body.doctorName)) !== null && _d !== void 0 ? _d : null,
            facilityName: (_e = (0, validation_1.optionalString)(body.facilityName)) !== null && _e !== void 0 ? _e : null,
            recordDate: (0, validation_1.parseDate)(body.recordDate, "recordDate", true),
            notes: (_f = (0, validation_1.optionalString)(body.notes)) !== null && _f !== void 0 ? _f : null,
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d, _e, _f;
        const data = {};
        if (body.recordType !== undefined)
            data.recordType = (0, validation_1.requireString)(body.recordType, "recordType");
        if (body.title !== undefined)
            data.title = (0, validation_1.requireString)(body.title, "title");
        if (body.description !== undefined)
            data.description = (_a = (0, validation_1.optionalString)(body.description)) !== null && _a !== void 0 ? _a : null;
        if (body.diagnosis !== undefined)
            data.diagnosis = (_b = (0, validation_1.optionalString)(body.diagnosis)) !== null && _b !== void 0 ? _b : null;
        if (body.treatment !== undefined)
            data.treatment = (_c = (0, validation_1.optionalString)(body.treatment)) !== null && _c !== void 0 ? _c : null;
        if (body.doctorName !== undefined)
            data.doctorName = (_d = (0, validation_1.optionalString)(body.doctorName)) !== null && _d !== void 0 ? _d : null;
        if (body.facilityName !== undefined)
            data.facilityName = (_e = (0, validation_1.optionalString)(body.facilityName)) !== null && _e !== void 0 ? _e : null;
        if (body.recordDate !== undefined)
            data.recordDate = (0, validation_1.parseDate)(body.recordDate, "recordDate", true);
        if (body.notes !== undefined)
            data.notes = (_f = (0, validation_1.optionalString)(body.notes)) !== null && _f !== void 0 ? _f : null;
        return data;
    },
});
