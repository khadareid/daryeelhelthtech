"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.vitalSign, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return ({
            temperature: (_a = (0, validation_1.parseNumber)(body.temperature, "temperature")) !== null && _a !== void 0 ? _a : null,
            bloodPressureSys: (_b = (0, validation_1.parseNumber)(body.bloodPressureSys, "bloodPressureSys")) !== null && _b !== void 0 ? _b : null,
            bloodPressureDia: (_c = (0, validation_1.parseNumber)(body.bloodPressureDia, "bloodPressureDia")) !== null && _c !== void 0 ? _c : null,
            heartRate: (_d = (0, validation_1.parseNumber)(body.heartRate, "heartRate")) !== null && _d !== void 0 ? _d : null,
            respiratoryRate: (_e = (0, validation_1.parseNumber)(body.respiratoryRate, "respiratoryRate")) !== null && _e !== void 0 ? _e : null,
            oxygenSaturation: (_f = (0, validation_1.parseNumber)(body.oxygenSaturation, "oxygenSaturation")) !== null && _f !== void 0 ? _f : null,
            weight: (_g = (0, validation_1.parseNumber)(body.weight, "weight")) !== null && _g !== void 0 ? _g : null,
            height: (_h = (0, validation_1.parseNumber)(body.height, "height")) !== null && _h !== void 0 ? _h : null,
            bmi: (_j = (0, validation_1.parseNumber)(body.bmi, "bmi")) !== null && _j !== void 0 ? _j : null,
            source: (0, validation_1.optionalString)(body.source) || "MANUAL",
            recordedAt: (_k = (0, validation_1.parseDate)(body.recordedAt, "recordedAt")) !== null && _k !== void 0 ? _k : new Date(),
        });
    },
    sanitizeUpdate: (body) => {
        var _a;
        const data = {};
        for (const key of [
            "temperature",
            "bloodPressureSys",
            "bloodPressureDia",
            "heartRate",
            "respiratoryRate",
            "oxygenSaturation",
            "weight",
            "height",
            "bmi",
        ]) {
            if (body[key] !== undefined)
                data[key] = (_a = (0, validation_1.parseNumber)(body[key], key)) !== null && _a !== void 0 ? _a : null;
        }
        if (body.source !== undefined)
            data.source = (0, validation_1.optionalString)(body.source) || "MANUAL";
        if (body.recordedAt !== undefined)
            data.recordedAt = (0, validation_1.parseDate)(body.recordedAt, "recordedAt");
        return data;
    },
});
