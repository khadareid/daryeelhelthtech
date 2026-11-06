"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.allergy, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e;
        return ({
            allergen: (0, validation_1.requireString)(body.allergen, "allergen"),
            type: (_a = (0, validation_1.optionalString)(body.type)) !== null && _a !== void 0 ? _a : null,
            severity: (_b = (0, validation_1.optionalString)(body.severity)) !== null && _b !== void 0 ? _b : null,
            reaction: (_c = (0, validation_1.optionalString)(body.reaction)) !== null && _c !== void 0 ? _c : null,
            diagnosedAt: (_d = (0, validation_1.parseDate)(body.diagnosedAt, "diagnosedAt")) !== null && _d !== void 0 ? _d : null,
            isActive: (0, validation_1.parseBool)(body.isActive, true),
            notes: (_e = (0, validation_1.optionalString)(body.notes)) !== null && _e !== void 0 ? _e : null,
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d, _e;
        const data = {};
        if (body.allergen !== undefined)
            data.allergen = (0, validation_1.requireString)(body.allergen, "allergen");
        if (body.type !== undefined)
            data.type = (_a = (0, validation_1.optionalString)(body.type)) !== null && _a !== void 0 ? _a : null;
        if (body.severity !== undefined)
            data.severity = (_b = (0, validation_1.optionalString)(body.severity)) !== null && _b !== void 0 ? _b : null;
        if (body.reaction !== undefined)
            data.reaction = (_c = (0, validation_1.optionalString)(body.reaction)) !== null && _c !== void 0 ? _c : null;
        if (body.diagnosedAt !== undefined)
            data.diagnosedAt = (_d = (0, validation_1.parseDate)(body.diagnosedAt, "diagnosedAt")) !== null && _d !== void 0 ? _d : null;
        if (body.isActive !== undefined)
            data.isActive = (0, validation_1.parseBool)(body.isActive);
        if (body.notes !== undefined)
            data.notes = (_e = (0, validation_1.optionalString)(body.notes)) !== null && _e !== void 0 ? _e : null;
        return data;
    },
});
