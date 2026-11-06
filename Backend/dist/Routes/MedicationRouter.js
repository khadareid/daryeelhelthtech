"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.medication, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return ({
            name: (0, validation_1.requireString)(body.name, "name"),
            dosage: (_a = (0, validation_1.optionalString)(body.dosage)) !== null && _a !== void 0 ? _a : null,
            frequency: (_b = (0, validation_1.optionalString)(body.frequency)) !== null && _b !== void 0 ? _b : null,
            route: (_c = (0, validation_1.optionalString)(body.route)) !== null && _c !== void 0 ? _c : null,
            startedAt: (_d = (0, validation_1.parseDate)(body.startedAt, "startedAt")) !== null && _d !== void 0 ? _d : null,
            endedAt: (_e = (0, validation_1.parseDate)(body.endedAt, "endedAt")) !== null && _e !== void 0 ? _e : null,
            isActive: (0, validation_1.parseBool)(body.isActive, true),
            prescribedBy: (_f = (0, validation_1.optionalString)(body.prescribedBy)) !== null && _f !== void 0 ? _f : null,
            reason: (_g = (0, validation_1.optionalString)(body.reason)) !== null && _g !== void 0 ? _g : null,
            notes: (_h = (0, validation_1.optionalString)(body.notes)) !== null && _h !== void 0 ? _h : null,
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const data = {};
        if (body.name !== undefined)
            data.name = (0, validation_1.requireString)(body.name, "name");
        if (body.dosage !== undefined)
            data.dosage = (_a = (0, validation_1.optionalString)(body.dosage)) !== null && _a !== void 0 ? _a : null;
        if (body.frequency !== undefined)
            data.frequency = (_b = (0, validation_1.optionalString)(body.frequency)) !== null && _b !== void 0 ? _b : null;
        if (body.route !== undefined)
            data.route = (_c = (0, validation_1.optionalString)(body.route)) !== null && _c !== void 0 ? _c : null;
        if (body.startedAt !== undefined)
            data.startedAt = (_d = (0, validation_1.parseDate)(body.startedAt, "startedAt")) !== null && _d !== void 0 ? _d : null;
        if (body.endedAt !== undefined)
            data.endedAt = (_e = (0, validation_1.parseDate)(body.endedAt, "endedAt")) !== null && _e !== void 0 ? _e : null;
        if (body.isActive !== undefined)
            data.isActive = (0, validation_1.parseBool)(body.isActive);
        if (body.prescribedBy !== undefined)
            data.prescribedBy = (_f = (0, validation_1.optionalString)(body.prescribedBy)) !== null && _f !== void 0 ? _f : null;
        if (body.reason !== undefined)
            data.reason = (_g = (0, validation_1.optionalString)(body.reason)) !== null && _g !== void 0 ? _g : null;
        if (body.notes !== undefined)
            data.notes = (_h = (0, validation_1.optionalString)(body.notes)) !== null && _h !== void 0 ? _h : null;
        return data;
    },
});
