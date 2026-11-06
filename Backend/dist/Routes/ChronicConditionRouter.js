"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.chronicCondition, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d;
        return ({
            condition: (0, validation_1.requireString)(body.condition, "condition"),
            icdCode: (_a = (0, validation_1.optionalString)(body.icdCode)) !== null && _a !== void 0 ? _a : null,
            diagnosedAt: (_b = (0, validation_1.parseDate)(body.diagnosedAt, "diagnosedAt")) !== null && _b !== void 0 ? _b : null,
            severity: (_c = (0, validation_1.optionalString)(body.severity)) !== null && _c !== void 0 ? _c : null,
            isActive: (0, validation_1.parseBool)(body.isActive, true),
            isControlled: (0, validation_1.parseBool)(body.isControlled, false),
            notes: (_d = (0, validation_1.optionalString)(body.notes)) !== null && _d !== void 0 ? _d : null,
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d;
        const data = {};
        if (body.condition !== undefined)
            data.condition = (0, validation_1.requireString)(body.condition, "condition");
        if (body.icdCode !== undefined)
            data.icdCode = (_a = (0, validation_1.optionalString)(body.icdCode)) !== null && _a !== void 0 ? _a : null;
        if (body.diagnosedAt !== undefined)
            data.diagnosedAt = (_b = (0, validation_1.parseDate)(body.diagnosedAt, "diagnosedAt")) !== null && _b !== void 0 ? _b : null;
        if (body.severity !== undefined)
            data.severity = (_c = (0, validation_1.optionalString)(body.severity)) !== null && _c !== void 0 ? _c : null;
        if (body.isActive !== undefined)
            data.isActive = (0, validation_1.parseBool)(body.isActive);
        if (body.isControlled !== undefined)
            data.isControlled = (0, validation_1.parseBool)(body.isControlled);
        if (body.notes !== undefined)
            data.notes = (_d = (0, validation_1.optionalString)(body.notes)) !== null && _d !== void 0 ? _d : null;
        return data;
    },
});
