"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const createOwnedRouter_1 = require("../utils/createOwnedRouter");
const validation_1 = require("../utils/validation");
exports.default = (0, createOwnedRouter_1.createOwnedRouter)(prisma_1.prisma.medicalDocument, {
    sanitizeCreate: (body) => {
        var _a, _b, _c, _d, _e, _f;
        return ({
            medicalRecordId: (_a = (0, validation_1.optionalString)(body.medicalRecordId)) !== null && _a !== void 0 ? _a : null,
            title: (0, validation_1.requireString)(body.title, "title"),
            documentType: (0, validation_1.requireString)(body.documentType, "documentType"),
            fileUrl: (0, validation_1.requireString)(body.fileUrl, "fileUrl"),
            fileName: (_b = (0, validation_1.optionalString)(body.fileName)) !== null && _b !== void 0 ? _b : null,
            mimeType: (_c = (0, validation_1.optionalString)(body.mimeType)) !== null && _c !== void 0 ? _c : null,
            fileSize: (_d = (0, validation_1.parseNumber)(body.fileSize, "fileSize")) !== null && _d !== void 0 ? _d : null,
            description: (_e = (0, validation_1.optionalString)(body.description)) !== null && _e !== void 0 ? _e : null,
            documentDate: (_f = (0, validation_1.parseDate)(body.documentDate, "documentDate")) !== null && _f !== void 0 ? _f : null,
            isVerified: (0, validation_1.parseBool)(body.isVerified, false),
        });
    },
    sanitizeUpdate: (body) => {
        var _a, _b, _c, _d, _e, _f;
        const data = {};
        if (body.medicalRecordId !== undefined)
            data.medicalRecordId = (_a = (0, validation_1.optionalString)(body.medicalRecordId)) !== null && _a !== void 0 ? _a : null;
        if (body.title !== undefined)
            data.title = (0, validation_1.requireString)(body.title, "title");
        if (body.documentType !== undefined)
            data.documentType = (0, validation_1.requireString)(body.documentType, "documentType");
        if (body.fileUrl !== undefined)
            data.fileUrl = (0, validation_1.requireString)(body.fileUrl, "fileUrl");
        if (body.fileName !== undefined)
            data.fileName = (_b = (0, validation_1.optionalString)(body.fileName)) !== null && _b !== void 0 ? _b : null;
        if (body.mimeType !== undefined)
            data.mimeType = (_c = (0, validation_1.optionalString)(body.mimeType)) !== null && _c !== void 0 ? _c : null;
        if (body.fileSize !== undefined)
            data.fileSize = (_d = (0, validation_1.parseNumber)(body.fileSize, "fileSize")) !== null && _d !== void 0 ? _d : null;
        if (body.description !== undefined)
            data.description = (_e = (0, validation_1.optionalString)(body.description)) !== null && _e !== void 0 ? _e : null;
        if (body.documentDate !== undefined)
            data.documentDate = (_f = (0, validation_1.parseDate)(body.documentDate, "documentDate")) !== null && _f !== void 0 ? _f : null;
        if (body.isVerified !== undefined)
            data.isVerified = (0, validation_1.parseBool)(body.isVerified);
        return data;
    },
});
