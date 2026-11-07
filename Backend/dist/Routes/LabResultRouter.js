"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.labResult, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return ({
            doctorId: (_a = (0, validation_1.optionalString)(body.doctorId)) !== null && _a !== void 0 ? _a : null,
            appointmentId: (_b = (0, validation_1.optionalString)(body.appointmentId)) !== null && _b !== void 0 ? _b : null,
            testName: (0, validation_1.requireString)(body.testName, "testName"),
            testCode: (_c = (0, validation_1.optionalString)(body.testCode)) !== null && _c !== void 0 ? _c : null,
            category: (_d = (0, validation_1.optionalString)(body.category)) !== null && _d !== void 0 ? _d : null,
            resultValue: (_e = (0, validation_1.optionalString)(body.resultValue)) !== null && _e !== void 0 ? _e : null,
            unit: (_f = (0, validation_1.optionalString)(body.unit)) !== null && _f !== void 0 ? _f : null,
            referenceRange: (_g = (0, validation_1.optionalString)(body.referenceRange)) !== null && _g !== void 0 ? _g : null,
            status: (_h = (0, validation_1.optionalString)(body.status)) !== null && _h !== void 0 ? _h : null,
            interpretation: (_j = (0, validation_1.optionalString)(body.interpretation)) !== null && _j !== void 0 ? _j : null,
            labName: (_k = (0, validation_1.optionalString)(body.labName)) !== null && _k !== void 0 ? _k : null,
            resultDate: (0, validation_1.parseDate)(body.resultDate, "resultDate", true),
            documentUrl: (_l = (0, validation_1.optionalString)(body.documentUrl)) !== null && _l !== void 0 ? _l : null,
            notes: (_m = (0, validation_1.optionalString)(body.notes)) !== null && _m !== void 0 ? _m : null,
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const data = {};
        if (body.doctorId !== undefined)
            data.doctorId = (_a = (0, validation_1.optionalString)(body.doctorId)) !== null && _a !== void 0 ? _a : null;
        if (body.appointmentId !== undefined)
            data.appointmentId = (_b = (0, validation_1.optionalString)(body.appointmentId)) !== null && _b !== void 0 ? _b : null;
        if (body.testName !== undefined)
            data.testName = (0, validation_1.requireString)(body.testName, "testName");
        if (body.testCode !== undefined)
            data.testCode = (_c = (0, validation_1.optionalString)(body.testCode)) !== null && _c !== void 0 ? _c : null;
        if (body.category !== undefined)
            data.category = (_d = (0, validation_1.optionalString)(body.category)) !== null && _d !== void 0 ? _d : null;
        if (body.resultValue !== undefined)
            data.resultValue = (_e = (0, validation_1.optionalString)(body.resultValue)) !== null && _e !== void 0 ? _e : null;
        if (body.unit !== undefined)
            data.unit = (_f = (0, validation_1.optionalString)(body.unit)) !== null && _f !== void 0 ? _f : null;
        if (body.referenceRange !== undefined)
            data.referenceRange = (_g = (0, validation_1.optionalString)(body.referenceRange)) !== null && _g !== void 0 ? _g : null;
        if (body.status !== undefined)
            data.status = (_h = (0, validation_1.optionalString)(body.status)) !== null && _h !== void 0 ? _h : null;
        if (body.interpretation !== undefined)
            data.interpretation = (_j = (0, validation_1.optionalString)(body.interpretation)) !== null && _j !== void 0 ? _j : null;
        if (body.labName !== undefined)
            data.labName = (_k = (0, validation_1.optionalString)(body.labName)) !== null && _k !== void 0 ? _k : null;
        if (body.resultDate !== undefined)
            data.resultDate = (0, validation_1.parseDate)(body.resultDate, "resultDate", true);
        if (body.documentUrl !== undefined)
            data.documentUrl = (_l = (0, validation_1.optionalString)(body.documentUrl)) !== null && _l !== void 0 ? _l : null;
        if (body.notes !== undefined)
            data.notes = (_m = (0, validation_1.optionalString)(body.notes)) !== null && _m !== void 0 ? _m : null;
        return data;
    },
});
