"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.emergencyContact, {
    sanitizeCreate: (body) => {
        var _a, _b;
        return ({
            fullName: (0, validation_1.requireString)(body.fullName, "fullName"),
            relationship: (0, validation_1.requireString)(body.relationship, "relationship"),
            phone: (0, validation_1.requireString)(body.phone, "phone"),
            alternatePhone: (_a = (0, validation_1.optionalString)(body.alternatePhone)) !== null && _a !== void 0 ? _a : null,
            email: (_b = (0, validation_1.optionalString)(body.email)) !== null && _b !== void 0 ? _b : null,
            isPrimary: (0, validation_1.parseBool)(body.isPrimary, false),
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b;
        const data = {};
        if (body.fullName !== undefined)
            data.fullName = (0, validation_1.requireString)(body.fullName, "fullName");
        if (body.relationship !== undefined)
            data.relationship = (0, validation_1.requireString)(body.relationship, "relationship");
        if (body.phone !== undefined)
            data.phone = (0, validation_1.requireString)(body.phone, "phone");
        if (body.alternatePhone !== undefined)
            data.alternatePhone = (_a = (0, validation_1.optionalString)(body.alternatePhone)) !== null && _a !== void 0 ? _a : null;
        if (body.email !== undefined)
            data.email = (_b = (0, validation_1.optionalString)(body.email)) !== null && _b !== void 0 ? _b : null;
        if (body.isPrimary !== undefined)
            data.isPrimary = (0, validation_1.parseBool)(body.isPrimary);
        return data;
    },
});
